"""
Extra feature endpoints:
- PR Reviewer
- Autopilot
- Architecture Refactor
- Dependency Scanner
- Plugin Runner
- Learning Mode
- Confidence Scoring
- Incremental Analysis
- Model Benchmarking
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Optional, List
from dataclasses import asdict

from ai_engine.ollama_client import ask_ai
from ai_engine.prompts import (
    pr_review_prompt, autopilot_prompt, architecture_refactor_prompt,
    learning_mode_prompt, model_benchmark_prompt, semantic_nav_prompt,
)
from analyzers.dependency_scanner import scan_dependencies
from analyzers.plugin_system import run_plugins, list_plugins
from analyzers.confidence_scorer import score_code, format_findings
from analyzers.incremental import filter_changed_files
from analyzers.analytics_db import save_analysis, make_repo_id

router = APIRouter()


# ── PR Reviewer ───────────────────────────────────────────────────────────────
class PRRequest(BaseModel):
    diff: str
    context: str = ""
    repo_name: str = "unknown"

@router.post("/pr-review")
def pr_review(req: PRRequest):
    review = ask_ai(pr_review_prompt(req.diff, req.context))
    return {"review": review, "diff_lines": len(req.diff.splitlines())}


# ── Autopilot ─────────────────────────────────────────────────────────────────
class AutopilotRequest(BaseModel):
    files: Dict[str, str]
    max_files: int = 5

@router.post("/autopilot")
def autopilot(req: AutopilotRequest):
    from analyzers.static_analyzer import run_pylint, run_bandit
    from analyzers.quality_score import calculate_score
    from analyzers.code_parser import parse_code

    all_results = []
    for filename, code in list(req.files.items())[:req.max_files]:
        pylint_out = run_pylint(code)
        bandit_out = run_bandit(code)
        parsed = parse_code(code)
        score = calculate_score(pylint_out, bandit_out, "", function_count=len(parsed.functions), line_count=len(code.splitlines()))
        issues_summary = f"File: {filename}\nBugs: {score.bugs} | Security: {score.security_issues} | Smells: {score.code_smells}\nIssues: {'; '.join(score.issues[:5])}"
        improvement = ask_ai(autopilot_prompt(issues_summary, code))
        all_results.append({
            "file": filename,
            "before_score": score.score,
            "before_grade": score.grade,
            "improvement_plan": improvement,
        })

    return {"results": all_results, "files_processed": len(all_results)}


# ── Architecture Refactor ─────────────────────────────────────────────────────
class ArchRefactorRequest(BaseModel):
    architecture_summary: str

@router.post("/architecture-refactor")
def architecture_refactor(req: ArchRefactorRequest):
    suggestions = ask_ai(architecture_refactor_prompt(req.architecture_summary))
    return {"suggestions": suggestions}


# ── Dependency Scanner ────────────────────────────────────────────────────────
class DependencyRequest(BaseModel):
    content: str
    filename: str = "requirements.txt"

@router.post("/dependency-scan")
def dependency_scan(req: DependencyRequest):
    result = scan_dependencies(req.content, req.filename)
    return {
        "ecosystem": result.ecosystem,
        "packages_scanned": result.packages_scanned,
        "vulnerabilities": [asdict(v) for v in result.vulnerabilities],
        "safe_packages": result.safe_packages,
        "vulnerability_count": len(result.vulnerabilities),
        "error": result.error,
    }


# ── Plugin Runner ─────────────────────────────────────────────────────────────
class PluginRequest(BaseModel):
    code: str
    filename: str = "code.py"
    language: str = "python"

@router.post("/plugins/run")
def run_plugins_endpoint(req: PluginRequest):
    results = run_plugins(req.code, req.filename, req.language)
    return {
        "plugin_results": [asdict(r) for r in results],
        "plugins_run": len(results),
    }

@router.get("/plugins/list")
def list_plugins_endpoint():
    return {"plugins": list_plugins()}


# ── Confidence Scoring ────────────────────────────────────────────────────────
class ConfidenceRequest(BaseModel):
    code: str
    ai_text: str = ""

@router.post("/confidence-score")
def confidence_score(req: ConfidenceRequest):
    findings = score_code(req.code, req.ai_text)
    return {
        "findings": format_findings(findings),
        "total": len(findings),
        "high_confidence": sum(1 for f in findings if f.confidence_label == "high"),
    }


# ── Incremental Analysis ──────────────────────────────────────────────────────
class IncrementalRequest(BaseModel):
    files: Dict[str, str]
    cache: Dict[str, str] = {}  # {filename: md5_hash}

@router.post("/incremental-analyze")
def incremental_analyze(req: IncrementalRequest):
    changed, new_cache = filter_changed_files(req.files, req.cache)
    if not changed:
        return {"changed_files": [], "cache": new_cache, "message": "No changes detected"}

    from analyzers.parallel_engine import analyze_files_static_parallel
    results = analyze_files_static_parallel(changed)
    return {
        "changed_files": list(changed.keys()),
        "unchanged_files": [f for f in req.files if f not in changed],
        "results": results,
        "cache": new_cache,
    }


# ── Learning Mode ─────────────────────────────────────────────────────────────
class LearningRequest(BaseModel):
    code: str
    level: str = "beginner"  # beginner | intermediate | advanced

@router.post("/learning-mode")
def learning_mode(req: LearningRequest):
    explanation = ask_ai(learning_mode_prompt(req.code, req.level))
    return {"explanation": explanation, "level": req.level}


# ── Model Benchmarking ────────────────────────────────────────────────────────
class BenchmarkRequest(BaseModel):
    code: str
    task: str = "review"
    models: List[str] = ["deepseek-coder"]

@router.post("/benchmark")
def benchmark_models(req: BenchmarkRequest):
    import time
    from ai_engine.ollama_client import ask_ai_with_model
    results = []
    for model in req.models[:3]:  # cap at 3 models
        start = time.time()
        try:
            response = ask_ai_with_model(model_benchmark_prompt(req.code, req.task), model)
            elapsed = round(time.time() - start, 2)
            results.append({
                "model": model,
                "response": response,
                "response_time_sec": elapsed,
                "response_length": len(response),
                "status": "ok",
            })
        except Exception as e:
            results.append({"model": model, "error": str(e), "status": "error"})
    return {"benchmarks": results}


# ── Performance Analyzer ──────────────────────────────────────────────────────
class PerformanceRequest(BaseModel):
    code: str

@router.post("/performance")
def performance_analyze(req: PerformanceRequest):
    import re, ast
    from ai_engine.prompts import code_review_prompt

    issues = []
    lines = req.code.splitlines()
    functions_analyzed = 0

    # Static pattern detection
    for i, line in enumerate(lines, 1):
        stripped = line.strip()
        # Nested loops — O(n²) risk
        indent = len(line) - len(line.lstrip())
        if re.match(r'for .+ in ', stripped) or re.match(r'while ', stripped):
            # Check if there's another loop inside
            for j in range(i, min(i + 20, len(lines))):
                inner = lines[j].strip()
                inner_indent = len(lines[j]) - len(lines[j].lstrip())
                if inner_indent > indent and (re.match(r'for .+ in ', inner) or re.match(r'while ', inner)):
                    issues.append({
                        "function": _find_enclosing_fn(lines, i - 1),
                        "line": i,
                        "severity": "critical",
                        "description": "Nested loop detected — likely O(n²) or worse time complexity",
                        "complexity": "O(n²)",
                        "suggestion": "Consider using a set/dict for O(1) lookups instead of inner loop",
                    })
                    break

        # range(len(...)) antipattern
        if re.search(r'range\s*\(\s*len\s*\(', stripped):
            issues.append({
                "function": _find_enclosing_fn(lines, i - 1),
                "line": i,
                "severity": "warning",
                "description": "range(len(x)) pattern — use enumerate() or direct iteration",
                "complexity": "O(n)",
                "suggestion": "Replace with: for item in items: or for i, item in enumerate(items):",
            })

        # Recursive fibonacci / exponential recursion
        if re.match(r'def (\w+)', stripped):
            fn_name = re.match(r'def (\w+)', stripped).group(1)
            functions_analyzed += 1
            # Check if function calls itself
            for k in range(i, min(i + 30, len(lines))):
                if fn_name in lines[k] and k != i - 1:
                    body_line = lines[k].strip()
                    if re.search(rf'\b{fn_name}\s*\(', body_line) and not body_line.startswith("def "):
                        issues.append({
                            "function": fn_name,
                            "line": i,
                            "severity": "warning",
                            "description": f"Recursive function '{fn_name}' — may have exponential complexity without memoization",
                            "complexity": "O(2ⁿ) worst case",
                            "suggestion": "Add @functools.lru_cache or use iterative approach",
                        })
                        break

        # N+1 query pattern
        if re.search(r'for .+ in ', stripped):
            for j in range(i, min(i + 5, len(lines))):
                inner = lines[j].strip()
                if re.search(r'\.(get|find|query|fetch|select|execute)\s*\(', inner):
                    issues.append({
                        "function": _find_enclosing_fn(lines, i - 1),
                        "line": i,
                        "severity": "warning",
                        "description": "Possible N+1 query — database call inside loop",
                        "complexity": "O(n) queries",
                        "suggestion": "Batch the query outside the loop using IN clause or bulk fetch",
                    })
                    break

    # Deduplicate by line
    seen = set()
    unique_issues = []
    for issue in issues:
        key = (issue["line"], issue["description"][:30])
        if key not in seen:
            seen.add(key)
            unique_issues.append(issue)

    # AI analysis
    perf_prompt = f"""Analyze this code for performance issues.

Code:
```
{req.code[:3000]}
```

Focus on:
1. Time complexity of each function (Big O notation)
2. Memory usage issues
3. Inefficient algorithms
4. Database/IO bottlenecks
5. Specific optimization suggestions

Be concise and specific."""

    ai_analysis = ask_ai(perf_prompt)

    complexity_counts = {"critical": sum(1 for i in unique_issues if i["severity"] == "critical"),
                         "warning": sum(1 for i in unique_issues if i["severity"] == "warning")}
    overall = "High" if complexity_counts["critical"] > 0 else "Medium" if complexity_counts["warning"] > 1 else "Low"

    return {
        "issues": unique_issues,
        "functions_analyzed": functions_analyzed,
        "overall_complexity": overall,
        "ai_analysis": ai_analysis,
    }


def _find_enclosing_fn(lines, line_idx):
    """Walk backwards to find the enclosing function name."""
    import re
    for i in range(line_idx, max(0, line_idx - 30), -1):
        m = re.match(r'\s*def\s+(\w+)', lines[i])
        if m:
            return m.group(1)
    return "module-level"


# ── Report Generator ──────────────────────────────────────────────────────────
class ReportRequest(BaseModel):
    code: str
    repo_name: str = "project"

@router.post("/generate-report")
def generate_report(req: ReportRequest):
    from analyzers.static_analyzer import run_pylint, run_bandit, run_flake8
    from analyzers.quality_score import calculate_score
    from analyzers.code_parser import parse_code
    from analyzers.confidence_scorer import score_code, format_findings
    from datetime import datetime

    pylint_out = run_pylint(req.code)
    bandit_out = run_bandit(req.code)
    flake8_out = run_flake8(req.code)
    parsed = parse_code(req.code)
    quality = calculate_score(pylint_out, bandit_out, flake8_out,
                              function_count=len(parsed.functions),
                              line_count=len(req.code.splitlines()))
    findings = format_findings(score_code(req.code))

    # AI summary
    summary_prompt = f"""Write a concise executive summary for a code quality report.

Project: {req.repo_name}
Quality Score: {quality.score}/10 (Grade: {quality.grade})
Bugs: {quality.bugs} | Security Issues: {quality.security_issues} | Code Smells: {quality.code_smells}
Functions: {len(parsed.functions)} | Lines: {len(req.code.splitlines())}
Top Issues: {'; '.join(quality.issues[:3])}

Write 3-4 sentences covering: overall quality, main risks, and top recommendation."""

    summary = ask_ai(summary_prompt)

    # Build markdown report
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    md = f"""# Code Quality Report — {req.repo_name}
Generated: {now}

## Executive Summary
{summary}

## Quality Metrics
| Metric | Value |
|--------|-------|
| Quality Score | {quality.score}/10 |
| Grade | {quality.grade} |
| Bugs | {quality.bugs} |
| Security Issues | {quality.security_issues} |
| Code Smells | {quality.code_smells} |
| Complexity | {quality.complexity} |
| Lines of Code | {len(req.code.splitlines())} |
| Functions | {len(parsed.functions)} |
| Classes | {len(parsed.classes)} |

## Issues Found
{chr(10).join(f"- {issue}" for issue in quality.issues) or "No issues detected."}

## Security Findings (Confidence-Scored)
{chr(10).join(f"- **{f['issue']}** — {f['confidence_label']} confidence ({int(f['confidence']*100)}%)" for f in findings) or "No security findings."}

## Functions Detected
{', '.join(f.name for f in parsed.functions) or 'None'}

## Static Analysis
### pylint
```
{pylint_out[:800] or 'No issues'}
```

### bandit
```
{bandit_out[:800] or 'No issues'}
```

## Recommendations
1. Address all HIGH severity security issues immediately
2. Refactor functions with complexity > Medium
3. Add unit tests for all public functions
4. Review and fix all pylint errors (E-codes)

---
*Generated by AI Code Assistant v4.0*
"""

    return {
        "markdown": md,
        "quality": {"score": quality.score, "grade": quality.grade, "bugs": quality.bugs, "security_issues": quality.security_issues},
        "repo_name": req.repo_name,
        "generated_at": now,
    }
