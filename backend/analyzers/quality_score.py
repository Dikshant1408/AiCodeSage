"""
Code Quality Score calculator.
Combines static analysis counts + AI findings into a 0-10 score.
"""
import re
from dataclasses import dataclass, field
from typing import List

@dataclass
class QualityReport:
    score: float
    grade: str
    bugs: int
    security_issues: int
    code_smells: int
    complexity: str
    issues: List[str] = field(default_factory=list)
    suggestions: List[str] = field(default_factory=list)

def calculate_score(
    pylint_output: str = "",
    bandit_output: str = "",
    flake8_output: str = "",
    ai_review: str = "",
    function_count: int = 0,
    line_count: int = 0,
) -> QualityReport:
    bugs = 0
    security_issues = 0
    code_smells = 0
    issues = []

    # Count pylint issues
    error_matches = re.findall(r'\bE\d{4}\b', pylint_output)
    warning_matches = re.findall(r'\bW\d{4}\b', pylint_output)
    convention_matches = re.findall(r'\bC\d{4}\b', pylint_output)
    bugs += len(error_matches)
    code_smells += len(warning_matches) + len(convention_matches)

    # Count bandit issues
    high = len(re.findall(r'Severity: High', bandit_output, re.IGNORECASE))
    medium = len(re.findall(r'Severity: Medium', bandit_output, re.IGNORECASE))
    low = len(re.findall(r'Severity: Low', bandit_output, re.IGNORECASE))
    security_issues += high * 3 + medium * 2 + low

    # Count flake8 issues
    flake_lines = [l for l in flake8_output.splitlines() if l.strip() and ':' in l]
    code_smells += len(flake_lines)

    # Parse AI review for keywords
    ai_lower = ai_review.lower()
    bug_keywords = ['bug', 'error', 'crash', 'exception', 'null', 'undefined', 'infinite loop', 'off-by-one']
    smell_keywords = ['complex', 'duplicate', 'long function', 'magic number', 'naming', 'refactor']
    for kw in bug_keywords:
        count = ai_lower.count(kw)
        bugs += min(count, 2)
    for kw in smell_keywords:
        count = ai_lower.count(kw)
        code_smells += min(count, 1)

    # Complexity based on function count and lines
    if function_count == 0:
        complexity = "N/A"
    elif line_count / max(function_count, 1) > 50:
        complexity = "High"
        code_smells += 2
    elif line_count / max(function_count, 1) > 25:
        complexity = "Medium"
    else:
        complexity = "Low"

    # Score formula
    raw_score = 10 - (bugs * 1.5 + security_issues * 2.0 + code_smells * 0.3)
    score = round(max(0.0, min(10.0, raw_score)), 1)

    # Grade
    if score >= 9:   grade = "A+"
    elif score >= 8: grade = "A"
    elif score >= 7: grade = "B"
    elif score >= 6: grade = "C"
    elif score >= 5: grade = "D"
    else:            grade = "F"

    # Build issue list
    if error_matches:
        issues.append(f"pylint: {len(error_matches)} error(s) — {', '.join(list(set(error_matches))[:5])}")
    if high:
        issues.append(f"bandit: {high} HIGH severity security issue(s)")
    if medium:
        issues.append(f"bandit: {medium} MEDIUM severity security issue(s)")
    if flake_lines:
        issues.append(f"flake8: {len(flake_lines)} style violation(s)")

    return QualityReport(
        score=score, grade=grade,
        bugs=bugs, security_issues=security_issues,
        code_smells=code_smells, complexity=complexity,
        issues=issues,
    )
