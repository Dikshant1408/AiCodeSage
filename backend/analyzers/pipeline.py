"""
Optimized analysis pipeline — single AI call per analysis type.
File → Parser → Static Analysis → 1 AI call → Score → Report
"""
from analyzers.code_parser import parse_code
from analyzers.static_analyzer import run_pylint, run_bandit, run_flake8
from analyzers.quality_score import calculate_score, QualityReport
from ai_engine.ollama_client import ask_ai
from ai_engine.prompts import code_review_prompt, bug_detection_prompt, security_prompt
from dataclasses import dataclass, field
from typing import List, Dict

@dataclass
class FunctionAnalysis:
    name: str
    params: List[str]
    start_line: int
    end_line: int
    review: str = ""
    bugs: str = ""

@dataclass
class PipelineResult:
    language: str
    functions_found: List[str]
    classes_found: List[str]
    imports: List[str]
    function_analyses: List[FunctionAnalysis]
    static: Dict[str, str]
    ai_review: str
    ai_bugs: str
    ai_security: str
    quality: QualityReport
    line_count: int


def _combined_review_prompt(code: str, functions: list) -> str:
    """Single prompt that gets review + bugs for all functions at once."""
    fn_list = "\n".join(f"- {f.name}() line {f.start_line}" for f in functions[:6])
    return f"""You are a senior software engineer. Analyze this code.

Functions detected: 
{fn_list}

Provide:
1. OVERALL REVIEW: Key issues, bad practices, improvements (be concise)
2. BUGS: List each bug with line number and fix suggestion
3. PER-FUNCTION: For each function above, one line summary of issues

Code:
```
{code[:4000]}
```

Keep total response under 600 words."""


def run_pipeline(code: str, language: str = "python", analyze_functions: bool = True) -> PipelineResult:
    """Run the full analysis pipeline — optimized to 1 AI call."""

    # Step 1 — Parse
    parsed = parse_code(code, language)
    line_count = len(code.splitlines())

    # Step 2 — Static analysis (fast, parallel-safe)
    static = {"pylint": "", "bandit": "", "flake8": ""}
    if language == "python":
        static["pylint"] = run_pylint(code)
        static["bandit"] = run_bandit(code)
        static["flake8"] = run_flake8(code)

    # Step 3 — Single combined AI call instead of 3+ sequential calls
    combined = ask_ai(_combined_review_prompt(code, parsed.functions))

    # Split the combined response into sections
    ai_review   = _extract_section(combined, "OVERALL REVIEW", "BUGS")
    ai_bugs     = _extract_section(combined, "BUGS", "PER-FUNCTION")
    per_fn_text = _extract_section(combined, "PER-FUNCTION", None)

    # Fallback: if sections not found, use full response
    if not ai_review.strip():
        ai_review = combined
    if not ai_bugs.strip():
        ai_bugs = combined

    # Step 4 — Build per-function analyses from the single response (no extra AI calls)
    function_analyses = []
    if analyze_functions and parsed.functions:
        for fn in parsed.functions[:6]:
            fa = FunctionAnalysis(
                name=fn.name,
                params=fn.params,
                start_line=fn.start_line,
                end_line=fn.end_line,
            )
            # Extract this function's summary from per_fn_text
            fn_summary = _find_function_summary(per_fn_text, fn.name)
            fa.review = fn_summary or "See overall review above."
            fa.bugs = ""
            function_analyses.append(fa)

    # Step 5 — Security: use static bandit output + quick AI note (reuse combined)
    ai_security = f"Static scan (bandit):\n{static['bandit']}\n\nAI notes:\n{_extract_security_notes(combined)}"

    # Step 6 — Quality score
    quality = calculate_score(
        pylint_output=static["pylint"],
        bandit_output=static["bandit"],
        flake8_output=static["flake8"],
        ai_review=ai_review,
        function_count=len(parsed.functions),
        line_count=line_count,
    )

    return PipelineResult(
        language=language,
        functions_found=[f.name for f in parsed.functions],
        classes_found=[c.name for c in parsed.classes],
        imports=parsed.imports,
        function_analyses=function_analyses,
        static=static,
        ai_review=ai_review,
        ai_bugs=ai_bugs,
        ai_security=ai_security,
        quality=quality,
        line_count=line_count,
    )


def _extract_section(text: str, start_marker: str, end_marker: str | None) -> str:
    """Extract text between two section markers."""
    import re
    # Try numbered format: "1. OVERALL REVIEW:" or "OVERALL REVIEW:"
    pattern = rf'(?:\d+\.\s*)?{re.escape(start_marker)}[:\s]*(.*?)'
    if end_marker:
        pattern += rf'(?=(?:\d+\.\s*)?{re.escape(end_marker)}[:\s]|$)'
    else:
        pattern += r'$'
    m = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
    return m.group(1).strip() if m else ""


def _find_function_summary(per_fn_text: str, fn_name: str) -> str:
    """Find a function's summary line in the per-function section."""
    import re
    pattern = rf'{re.escape(fn_name)}\s*\(?[^)]*\)?\s*[:\-–]\s*(.+?)(?=\n[a-zA-Z_]|\Z)'
    m = re.search(pattern, per_fn_text, re.IGNORECASE | re.DOTALL)
    if m:
        return m.group(1).strip()[:300]
    # Fallback: find any line mentioning the function
    for line in per_fn_text.splitlines():
        if fn_name.lower() in line.lower() and len(line) > len(fn_name) + 5:
            return line.strip()[:300]
    return ""


def _extract_security_notes(text: str) -> str:
    """Pull any security-related sentences from the combined response."""
    keywords = ["injection", "secret", "password", "eval", "exec", "unsafe", "vulnerability", "xss", "csrf"]
    lines = []
    for line in text.splitlines():
        if any(k in line.lower() for k in keywords):
            lines.append(line.strip())
    return "\n".join(lines[:10]) if lines else "No specific security issues mentioned in review."
