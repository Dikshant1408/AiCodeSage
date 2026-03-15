from fastapi import APIRouter
from pydantic import BaseModel
from ai_engine.groq_client import ask_ai
from ai_engine.prompts import documentation_prompt

router = APIRouter()

class CodeRequest(BaseModel):
    code: str

@router.post("/")
def generate_docs(req: CodeRequest):
    docs = ask_ai(documentation_prompt(req.code))
    return {"documentation": docs}
