"""
Autonomous Bug-Fix Agent
Scans a project (dict of filename→code), finds issues via static analysis,
then uses AI to generate a unified diff patch for each issue.
"""
import re
from dataclasses import dataclass, field
from typing import List, Dict

from analyzers.code_parser import parse_code
from analyzers.static_analyzer import run_pylint, run_bandit, run_flake8
from ai_engine.ollama_client import ask_ai


@dataclass
class DetectedIssue:
    file: str
    line: int
    severity: str          # "high" | "medium" | "low"
    category: str          # "bug" | "security" | "style" | "complexity"
    description: str
    code_snippet: str = ""


@dataclass
class FixPatch:
    issue: DetectedIssue
    patch: str             # unified diff text
    explanation: str
    confidence: str        # "high" | "medium" | "low"
    applied: bool = False


@dataclass
class AgentReport:
    files_scanned: int
    issues_found: int
    patches_generated: int
    patches: List[FixPatch] = field(default_factory=list)
    skipped: List[str] = field(default_factory=list)


# ── Issue extraction ──────────────────────────────────────────────────────────

def _extract_pylint_issues(output: str, filename: str) -> List[DetectedIssue]:
    issues = []
    # pylint format: filename.py:line:col: E/W/C code message
    pattern = re.compile(r':(\d+):\d+:\s+([EWCR]\d+):\s+(.+)')
    for m in pattern.finditer(output):
        line, code, msg = int(m.group(1)), m.group(2), m.group(3).strip()
        severity = "high" if code.startswith("E") else "medium" if code.startswith("W") else "low"
        category = "bug" if code.startswith("E") else "style"
        issues.append(DetectedIssue(
            file=filename, line=line, severity=severity,
            category=category, description=f"[{code}] {msg}",
        ))
    return issues


def _extract_bandit_issues(output: str, filename: str) -> List[DetectedIssue]:
    issues = []
    # bandit format: >> Issue: [Bxxx:name] description
    issue_blocks = re.split(r'>> Issue:', output)
    for block in issue_blocks[1:]:
        lines = block.strip().splitlines()
        desc_line = lines[0].strip() if lines else ""
        loc_match = re.search(r'Location:.*?:(\d+)', block)
        line = int(loc_match.group(1)) if loc_match else 0
        sev_match = re.search(r'Severity:\s+(\w+)', block)
        sev = (sev_match.group(1).lower() if sev_match else "medium")
        severity = "high" if sev == "high" else "medium" if sev == "medium" else "low"
        issues.append(DetectedIssue(
            file=filename, line=line, severity=severity,
            category="security", description=desc_line,
        ))
    return issues


def _get_snippet(code: str, line: int, context: int = 5) -> str:
    lines = code.splitlines()
    start = max(0, line - context - 1)
    end = min(len(lines), line + context)
    numbered = [f"{i+1:4}: {l}" for i, l in enumerate(lines[start:end], start)]
    return "\n".join(numbered)


# ── AI patch generation ───────────────────────────────────────────────────────

def _patch_prompt(filename: str, issue: DetectedIssue, code: str) -> str:
    return f"""You are an expert software engineer performing an automated code fix.

File: {filename}
Issue (line {issue.line}): {issue.description}
Category: {issue.category} | Severity: {issue.severity}

Relevant code:
```python
{issue.code_snippet}
```

Full file:
```python
{code[:3000]}
```

Return EXACTLY this format and nothing else:

EXPLANATION: <one sentence explaining the fix>
CONFIDENCE: <high|medium|low>
PATCH:
--- {filename}
+++ {filename} (fixed)
@@ line {issue.line} @@
<unified diff showing only the changed lines, - for removed, + for added>
"""


def _parse_ai_patch(response: str, issue: DetectedIssue) -> FixPatch:
    explanation = ""
    confidence = "medium"
    patch = ""

    exp_m = re.search(r'EXPLANATION:\s*(.+)', response)
    if exp_m:
        explanation = exp_m.group(1).strip()

    conf_m = re.search(r'CONFIDENCE:\s*(high|medium|low)', response, re.IGNORECASE)
    if conf_m:
        confidence = conf_m.group(1).lower()

    patch_m = re.search(r'PATCH:\s*\n([\s\S]+)', response)
    if patch_m:
        patch = patch_m.group(1).strip()
    else:
        patch = response.strip()

    return FixPatch(issue=issue, patch=patch, explanation=explanation, confidence=confidence)


# ── Main agent ────────────────────────────────────────────────────────────────

def run_bug_fix_agent(
    files: Dict[str, str],
    max_fixes_per_file: int = 3,
    severity_filter: str = "all",   # "all" | "high" | "high+medium"
) -> AgentReport:
    """
    Scan all files, detect issues, generate AI fix patches.
    Returns AgentReport with all patches ready for preview.
    """
    all_issues: List[DetectedIssue] = []
    skipped = []

    for filename, code in files.items():
        if not code.strip():
            skipped.append(filename)
            continue

        ext = filename.rsplit(".", 1)[-1].lower()
        if ext not in ("py", "js", "ts", "jsx", "tsx"):
            skipped.append(filename)
            continue

        if ext == "py":
            pylint_out = run_pylint(code)
            bandit_out = run_bandit(code)
            issues = _extract_pylint_issues(pylint_out, filename)
            issues += _extract_bandit_issues(bandit_out, filename)
        else:
            # For JS/TS: use AI-only detection
            issues = []

        # Attach code snippets
        for issue in issues:
            issue.code_snippet = _get_snippet(code, issue.line)

        # Filter by severity
        if severity_filter == "high":
            issues = [i for i in issues if i.severity == "high"]
        elif severity_filter == "high+medium":
            issues = [i for i in issues if i.severity in ("high", "medium")]

        # Sort: high first
        issues.sort(key=lambda x: {"high": 0, "medium": 1, "low": 2}[x.severity])
        all_issues.extend(issues[:max_fixes_per_file])

    # Generate patches
    patches: List[FixPatch] = []
    for issue in all_issues:
        code = files.get(issue.file, "")
        try:
            prompt = _patch_prompt(issue.file, issue, code)
            response = ask_ai(prompt)
            patch = _parse_ai_patch(response, issue)
            patches.append(patch)
        except Exception as e:
            patches.append(FixPatch(
                issue=issue,
                patch="",
                explanation=f"AI error: {e}",
                confidence="low",
            ))

    return AgentReport(
        files_scanned=len(files),
        issues_found=len(all_issues),
        patches_generated=len([p for p in patches if p.patch]),
        patches=patches,
        skipped=skipped,
    )
