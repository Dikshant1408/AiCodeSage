import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from ai_engine.ollama_client import ask_ai
from ai_engine.prompts import security_prompt
from analyzers.static_analyzer import run_bandit

logger = logging.getLogger(__name__)

router = APIRouter()

class CodeRequest(BaseModel):
    code: str

@router.post("/")
def security_scan(req: CodeRequest):
    if not req.code.strip():
        logger.warning("security_scan called with invalid or empty code input")
        raise HTTPException(status_code=400, detail="Invalid input: 'code' must be a non-empty string.")

    logger.info("Starting security scan")

    try:
        ai_result = ask_ai(security_prompt(req.code))
        logger.info("AI security analysis completed successfully")
    except Exception as e:
        logger.error("AI security analysis failed: %s", e)
        raise HTTPException(status_code=500, detail="AI security analysis failed. Please try again later.")

    try:
        bandit_result = run_bandit(req.code)
        logger.info("Bandit static security scan completed successfully")
    except Exception as e:
        logger.error("Bandit static security scan failed: %s", e)
        raise HTTPException(status_code=500, detail="Bandit scan failed. Please try again later.")

    logger.info("Security scan finished")
    return {"ai_security": ai_result, "bandit_scan": bandit_result}
