"""
Analysis pipeline — parallel static analysis + single short AI call.
"""
from analyzers.code_parser import parse_code
from analyzers.static_analyzer import run_all_parallel
from analyzers.quality_score import calculate_score, QualityReport
from ai_engine.ollama_client import ask_ai
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


def run_pipeline(code: str, language: str = "python", analyze_functions: bool = True) -> PipelineResult:
    parsed     = parse_code(code, language)
    line_count = len(code.splitlines())

    # All 3 static tools in parallel
    static = run_all_parallel(code) if language == "python" else {"pylint": "", "bandit": "", "flake8": ""}

    # Single short AI call
    fn_list = ", ".join(f.name for f in parsed.functions[:5])
    prompt  = f"""Review this code briefly. List: bugs (with line#), security issues, top 3 improvements.
Functions: {fn_list or 'none'}
Code (first 1500 chars):
```
{code[:1500]}
```
Max 300 words."""
    combined = ask_ai(prompt)

    quality = calculate_score(
        pylint_output=static["pylint"],
        bandit_output=static["bandit"],
        flake8_output=static["flake8"],
        ai_review=combined,
        function_count=len(parsed.functions),
        line_count=line_count,
    )

    function_analyses = []
    if analyze_functions:
        for fn in parsed.functions[:5]:
            function_analyses.append(FunctionAnalysis(
                name=fn.name, params=fn.params,
                start_line=fn.start_line, end_line=fn.end_line,
                review="See overall review.", bugs="",
            ))

    ai_security = f"Bandit:\n{static['bandit'][:400]}"

    return PipelineResult(
        language=language,
        functions_found=[f.name for f in parsed.functions],
        classes_found=[c.name for c in parsed.classes],
        imports=parsed.imports,
        function_analyses=function_analyses,
        static=static,
        ai_review=combined,
        ai_bugs=combined,
        ai_security=ai_security,
        quality=quality,
        line_count=line_count,
    )
