from fastapi import APIRouter
from pydantic import BaseModel
from ai_engine.groq_client import ask_ai
from ai_engine.prompts import security_prompt
from analyzers.static_analyzer import run_bandit

router = APIRouter()

class CodeRequest(BaseModel):
    code: str

@router.post("/")
def security_scan(req: CodeRequest):
    ai_result = ask_ai(security_prompt(req.code))
    bandit_result = run_bandit(req.code)
    return {"ai_security": ai_result, "bandit_scan": bandit_result}
