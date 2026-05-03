"""
Multi-Agent Autonomous Improvement Pipeline
Agent 1: Static Analyzer  — scores every file
Agent 2: Patch Generator  — AI diffs for top issues
Agent 3: Verifier         — re-runs static analysis on patched code, confirms improvement
Agent 4: Report Writer    — before/after markdown report
"""
import copy, time
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, List
from dataclasses import dataclass, field, asdict

from analyzers.static_analyzer import run_pylint, run_bandit, run_flake8
from analyzers.quality_score import calculate_score
from analyzers.code_parser import parse_code
from analyzers.bug_fix_agent import run_bug_fix_agent
from ai_engine.ollama_client import ask_ai

router = APIRouter()


# ── Models ────────────────────────────────────────────────────────────────────

class PipelineRequest(BaseModel):
    files: Dict[str, str]
    max_files: int = 5
    severity_filter: str = "all"   # all | high | medium


@dataclass
class FileScore:
    filename: str
    score: float
    grade: str
    bugs: int
    security_issues: int
    code_smells: int
    issues: List[str] = field(default_factory=list)


@dataclass
class PatchResult:
    filename: str
    patch: str
    explanation: str
    confidence: str
    issue_description: str


@dataclass
class VerifyResult:
    filename: str
    before_score: float
    after_score: float
    delta: float
    improved: bool
    patched_code: str


@dataclass
class PipelineReport:
    files_analyzed: int
    patches_generated: int
    files_improved: int
    avg_before: float
    avg_after: float
    avg_delta: float
    file_scores: List[dict] = field(default_factory=list)
    patches: List[dict] = field(default_factory=list)
    verifications: List[dict] = field(default_factory=list)
    executive_summary: str = ""
    duration_sec: float = 0.0


# ── Agent 1: Static Analyzer ──────────────────────────────────────────────────

def agent_analyze(files: Dict[str, str], max_files: int) -> List[FileScore]:
    """Score every file using static analysis."""
    scores = []
    for filename, code in list(files.items())[:max_files]:
        try:
            pylint_out = run_pylint(code)
            bandit_out = run_bandit(code)
            flake8_out = run_flake8(code)
            parsed = parse_code(code)
            q = calculate_score(pylint_out, bandit_out, flake8_out,
                                function_count=len(parsed.functions),
                                line_count=len(code.splitlines()))
            scores.append(FileScore(
                filename=filename,
                score=q.score,
                grade=q.grade,
                bugs=q.bugs,
                security_issues=q.security_issues,
                code_smells=q.code_smells,
                issues=q.issues[:8],
            ))
        except Exception as e:
            scores.append(FileScore(filename=filename, score=5.0, grade="C",
                                    bugs=0, security_issues=0, code_smells=0,
                                    issues=[f"Analysis error: {e}"]))
    return scores


# ── Agent 2: Patch Generator ──────────────────────────────────────────────────

def agent_patch(files: Dict[str, str], scores: List[FileScore],
                severity_filter: str) -> List[PatchResult]:
    """Generate AI patches for the worst-scoring files."""
    # Sort by score ascending (worst first), take top 3
    sorted_scores = sorted(scores, key=lambda s: s.score)[:3]
    patches = []

    for fs in sorted_scores:
        code = files.get(fs.filename, "")
        if not code.strip():
            continue
        top_issues = "\n".join(f"- {i}" for i in fs.issues[:5])
        prompt = f"""You are an expert software engineer. Fix the following issues in this code.

File: {fs.filename}
Quality Score: {fs.score}/10 (Grade: {fs.grade})
Issues to fix:
{top_issues}

Code:
```
{code[:3000]}
```

Respond in this exact format:
EXPLANATION: <one paragraph explaining what you fixed and why>
CONFIDENCE: <high|medium|low>
FIXED_CODE:
```
<complete fixed code here>
```"""
        try:
            response = ask_ai(prompt)
            explanation = _extract_between(response, "EXPLANATION:", "CONFIDENCE:").strip()
            confidence = _extract_between(response, "CONFIDENCE:", "FIXED_CODE:").strip().lower()
            fixed_code = _extract_code_block(response)
            if not confidence or confidence not in ("high", "medium", "low"):
                confidence = "medium"
            patches.append(PatchResult(
                filename=fs.filename,
                patch=fixed_code or code,
                explanation=explanation or "AI applied fixes.",
                confidence=confidence,
                issue_description="; ".join(fs.issues[:3]),
            ))
        except Exception as e:
            patches.append(PatchResult(
                filename=fs.filename,
                patch=code,
                explanation=f"Patch generation failed: {e}",
                confidence="low",
                issue_description="",
            ))
    return patches


# ── Agent 3: Verifier ─────────────────────────────────────────────────────────

def agent_verify(patches: List[PatchResult],
                 original_scores: Dict[str, FileScore]) -> List[VerifyResult]:
    """Re-run static analysis on patched code and compare scores."""
    results = []
    for patch in patches:
        original = original_scores.get(patch.filename)
        before = original.score if original else 5.0
        try:
            pylint_out = run_pylint(patch.patch)
            bandit_out = run_bandit(patch.patch)
            flake8_out = run_flake8(patch.patch)
            parsed = parse_code(patch.patch)
            q = calculate_score(pylint_out, bandit_out, flake8_out,
                                function_count=len(parsed.functions),
                                line_count=len(patch.patch.splitlines()))
            after = q.score
        except Exception:
            after = before
        results.append(VerifyResult(
            filename=patch.filename,
            before_score=round(before, 2),
            after_score=round(after, 2),
            delta=round(after - before, 2),
            improved=after > before,
            patched_code=patch.patch,
        ))
    return results


# ── Agent 4: Report Writer ────────────────────────────────────────────────────

def agent_report(scores: List[FileScore], verifications: List[VerifyResult]) -> str:
    """Generate executive summary from pipeline results."""
    improved = [v for v in verifications if v.improved]
    avg_before = sum(v.before_score for v in verifications) / max(len(verifications), 1)
    avg_after  = sum(v.after_score  for v in verifications) / max(len(verifications), 1)

    summary_input = f"""Pipeline completed on {len(scores)} files.
Patches generated: {len(verifications)}
Files improved: {len(improved)}/{len(verifications)}
Average score before: {avg_before:.1f}/10
Average score after:  {avg_after:.1f}/10
Delta: {avg_after - avg_before:+.1f}

Per-file results:
{chr(10).join(f"- {v.filename}: {v.before_score} → {v.after_score} ({'+' if v.delta >= 0 else ''}{v.delta})" for v in verifications)}

Write a 3-sentence executive summary covering: what was fixed, overall improvement, and top remaining risk."""

    try:
        return ask_ai(summary_input)
    except Exception:
        return f"Pipeline processed {len(scores)} files. {len(improved)} files improved. Average score: {avg_before:.1f} → {avg_after:.1f}."


# ── Orchestrator endpoint ─────────────────────────────────────────────────────

@router.post("/run")
def run_pipeline(req: PipelineRequest):
    """
    Full 4-agent pipeline:
    analyze → patch → verify → report
    """
    t0 = time.time()

    # Agent 1
    scores = agent_analyze(req.files, req.max_files)
    scores_by_file = {s.filename: s for s in scores}

    # Agent 2
    patches = agent_patch(req.files, scores, req.severity_filter)

    # Agent 3
    verifications = agent_verify(patches, scores_by_file)

    # Agent 4
    summary = agent_report(scores, verifications)

    avg_before = sum(v.before_score for v in verifications) / max(len(verifications), 1)
    avg_after  = sum(v.after_score  for v in verifications) / max(len(verifications), 1)

    report = PipelineReport(
        files_analyzed=len(scores),
        patches_generated=len(patches),
        files_improved=sum(1 for v in verifications if v.improved),
        avg_before=round(avg_before, 2),
        avg_after=round(avg_after, 2),
        avg_delta=round(avg_after - avg_before, 2),
        file_scores=[asdict(s) for s in scores],
        patches=[asdict(p) for p in patches],
        verifications=[asdict(v) for v in verifications],
        executive_summary=summary,
        duration_sec=round(time.time() - t0, 1),
    )
    return asdict(report)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _extract_between(text: str, start: str, end: str) -> str:
    try:
        s = text.index(start) + len(start)
        e = text.index(end, s)
        return text[s:e].strip()
    except ValueError:
        return ""


def _extract_code_block(text: str) -> str:
    """Extract code from first ```...``` block."""
    import re
    m = re.search(r'```(?:\w+)?\n(.*?)```', text, re.DOTALL)
    return m.group(1).strip() if m else ""
