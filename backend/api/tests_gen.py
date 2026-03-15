from fastapi import APIRouter
from pydantic import BaseModel
from ai_engine.test_generator import generate_tests
from analyzers.code_parser import parse_code

router = APIRouter()

class CodeRequest(BaseModel):
    code: str
    language: str = "python"

@router.post("/")
def generate_unit_tests(req: CodeRequest):
    parsed = parse_code(req.code, req.language)

    try:
        tests = generate_tests(req.code, req.language)
    except Exception as e:
        return {"error": f"Failed to generate tests: {e}"}

    if hasattr(parsed, 'functions'):
        functions_found = [f.name for f in parsed.functions]
    else:
        functions_found = []

    return {
        "functions_found": functions_found,
        "generated_tests": tests,
    }
