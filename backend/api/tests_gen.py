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
    tests = generate_tests(req.code, req.language)
    return {
        "functions_found": [f.name for f in parsed.functions],
        "generated_tests": tests,
    }
