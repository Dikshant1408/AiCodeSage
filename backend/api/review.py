from fastapi import APIRouter
from pydantic import BaseModel
from analyzers.pipeline import run_pipeline
from dataclasses import asdict

router = APIRouter()

class CodeRequest(BaseModel):
    code: str
    language: str = "python"
    analyze_functions: bool = True

@router.post("/")
def review_code(req: CodeRequest):
    result = run_pipeline(req.code, req.language, req.analyze_functions)
    return {
        "quality": asdict(result.quality),
        "functions_found": result.functions_found,
        "classes_found": result.classes_found,
        "imports": result.imports,
        "ai_review": result.ai_review,
        "refactoring_suggestions": result.ai_review,
        "static_analysis": result.static,
        "function_analyses": [
            {
                "name": fa.name,
                "params": fa.params,
                "start_line": fa.start_line,
                "end_line": fa.end_line,
                "review": fa.review,
                "bugs": fa.bugs,
            }
            for fa in result.function_analyses
        ],
    }
