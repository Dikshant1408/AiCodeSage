"""
Polyglot analysis endpoints — multi-language support.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Optional
from language_engines.detector import detect_language, get_engine
from analyzers.parallel_engine import analyze_files_static_parallel
from analyzers.confidence_scorer import score_code, format_findings
from ai_engine.ollama_client import ask_ai
from ai_engine.prompts import code_review_prompt

router = APIRouter()


class PolyglotRequest(BaseModel):
    code: str
    filename: str = "code.py"


class MultiFileRequest(BaseModel):
    files: Dict[str, str]
    parallel: bool = True


@router.post("/analyze")
def polyglot_analyze(req: PolyglotRequest):
    """Analyze a single file with the appropriate language engine."""
    lang = detect_language(req.filename)
    engine = get_engine(lang)
    result = engine.analyze(req.code, req.filename)

    # AI review
    ai_review = ask_ai(code_review_prompt(req.code))

    # Confidence scoring
    findings = score_code(req.code, ai_review, result.static_issues)

    return {
        "language": result.language,
        "filename": req.filename,
        "functions": result.functions,
        "classes": result.classes,
        "imports": result.imports,
        "static_issues": result.static_issues,
        "metrics": result.metrics,
        "ai_review": ai_review,
        "confidence_findings": format_findings(findings),
    }


@router.post("/multi-analyze")
def multi_file_analyze(req: MultiFileRequest):
    """Analyze multiple files in parallel using language-specific engines."""
    if req.parallel:
        results = analyze_files_static_parallel(req.files)
    else:
        from language_engines.detector import detect_language, get_engine
        results = {}
        for filename, code in req.files.items():
            lang = detect_language(filename)
            engine = get_engine(lang)
            r = engine.analyze(code, filename)
            results[filename] = {
                "language": r.language,
                "functions": r.functions,
                "classes": r.classes,
                "imports": r.imports,
                "static_issues": r.static_issues,
                "metrics": r.metrics,
            }

    # Aggregate stats
    total_issues = sum(len(r.get("static_issues", [])) for r in results.values() if isinstance(r, dict))
    languages = list({r.get("language", "unknown") for r in results.values() if isinstance(r, dict)})

    return {
        "files": results,
        "summary": {
            "files_analyzed": len(results),
            "total_static_issues": total_issues,
            "languages_detected": languages,
        },
    }
