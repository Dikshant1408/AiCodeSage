"""
AI Confidence & Evidence Scoring.
Combines static analysis agreement + pattern matching + prompt reasoning
to produce a confidence score for each AI finding.
"""
import re
from dataclasses import dataclass, field
from typing import List


@dataclass
class Evidence:
    source: str          # "static_analysis" | "pattern_match" | "ai_reasoning"
    description: str
    weight: float        # 0.0 – 1.0


@dataclass
class ScoredFinding:
    issue: str
    confidence: float    # 0.0 – 1.0
    confidence_label: str  # "high" | "medium" | "low"
    evidence: List[Evidence] = field(default_factory=list)
    data_flow: str = ""  # e.g. "user_input → query → execute()"


# Patterns that strongly indicate real issues
SECURITY_PATTERNS = {
    r"eval\s*\(": ("Unsafe eval() call", 0.9),
    r"exec\s*\(": ("Unsafe exec() call", 0.9),
    r"password\s*=\s*['\"][^'\"]+['\"]": ("Hardcoded password", 0.95),
    r"secret\s*=\s*['\"][^'\"]+['\"]": ("Hardcoded secret", 0.9),
    r"api_key\s*=\s*['\"][^'\"]+['\"]": ("Hardcoded API key", 0.95),
    r"SELECT.*\+.*user": ("Possible SQL injection", 0.85),
    r"os\.system\s*\(": ("Shell injection risk", 0.8),
    r"subprocess\.call\s*\(.*shell\s*=\s*True": ("Shell injection via subprocess", 0.85),
    r"pickle\.loads?\s*\(": ("Unsafe deserialization", 0.8),
    r"yaml\.load\s*\((?!.*Loader)": ("Unsafe YAML load", 0.75),
}

BUG_PATTERNS = {
    r"except\s*:": ("Bare except clause", 0.7),
    r"except\s+Exception\s*:": ("Catching generic Exception", 0.6),
    r"range\s*\(\s*len\s*\(": ("Antipattern: range(len(...))", 0.5),
    r"==\s*None": ("Use 'is None' instead of == None", 0.6),
    r"!=\s*None": ("Use 'is not None' instead of != None", 0.6),
    r"/\s*\w+\b(?!\s*!=\s*0)": ("Possible division by zero", 0.4),
}


def score_code(code: str, ai_text: str = "", static_issues: list = None) -> List[ScoredFinding]:
    """
    Analyze code and return scored findings with evidence.
    """
    findings: List[ScoredFinding] = []
    static_issues = static_issues or []

    # 1. Pattern-based detection
    for pattern, (description, base_confidence) in {**SECURITY_PATTERNS, **BUG_PATTERNS}.items():
        matches = list(re.finditer(pattern, code, re.IGNORECASE))
        if not matches:
            continue

        evidence = [Evidence(
            source="pattern_match",
            description=f"Regex pattern matched: `{pattern}`",
            weight=base_confidence,
        )]

        # 2. Check if static analysis also flagged this
        static_boost = 0.0
        for issue in static_issues:
            msg = issue.get("message", "").lower()
            if any(kw in msg for kw in description.lower().split()):
                static_boost = 0.1
                evidence.append(Evidence(
                    source="static_analysis",
                    description=f"Static analyzer also flagged: {issue.get('message', '')}",
                    weight=0.1,
                ))
                break

        # 3. Check if AI text mentions this issue
        ai_boost = 0.0
        if ai_text and any(kw in ai_text.lower() for kw in description.lower().split()[:2]):
            ai_boost = 0.05
            evidence.append(Evidence(
                source="ai_reasoning",
                description="AI review also mentioned this issue",
                weight=0.05,
            ))

        confidence = min(base_confidence + static_boost + ai_boost, 1.0)
        label = "high" if confidence >= 0.75 else "medium" if confidence >= 0.5 else "low"

        # Build data flow string for first match
        match = matches[0]
        start = max(0, match.start() - 40)
        end = min(len(code), match.end() + 40)
        snippet = code[start:end].replace("\n", " ").strip()

        findings.append(ScoredFinding(
            issue=description,
            confidence=round(confidence, 2),
            confidence_label=label,
            evidence=evidence,
            data_flow=snippet,
        ))

    return findings


def format_findings(findings: List[ScoredFinding]) -> list:
    return [
        {
            "issue": f.issue,
            "confidence": f.confidence,
            "confidence_label": f.confidence_label,
            "data_flow": f.data_flow,
            "evidence": [{"source": e.source, "description": e.description} for e in f.evidence],
        }
        for f in findings
    ]
