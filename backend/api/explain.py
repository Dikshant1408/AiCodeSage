from fastapi import APIRouter
from pydantic import BaseModel
from ai_engine.groq_client import ask_ai
from ai_engine.prompts import explain_prompt

router = APIRouter()

class CodeRequest(BaseModel):
    code: str

@router.post("/")
def explain_code(req: CodeRequest):
    explanation = ask_ai(explain_prompt(req.code))
    return {"explanation": explanation}
