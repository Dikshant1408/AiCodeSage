import os
from fastapi import HTTPException

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
DEFAULT_MODEL = "llama3-8b-8192"
AVAILABLE_MODELS = [
    "llama3-8b-8192",
    "llama3-70b-8192",
    "mixtral-8x7b-32768",
    "gemma-7b-it",
]

_client = None


def _get_client():
    global _client
    if _client is None:
        if not GROQ_API_KEY:
            raise HTTPException(
                status_code=503,
                detail="GROQ_API_KEY environment variable is not set.",
            )
        try:
            from groq import Groq
            _client = Groq(api_key=GROQ_API_KEY)
        except ImportError:
            raise HTTPException(
                status_code=503,
                detail="groq package not installed. Run: pip install groq",
            )
    return _client


def ask_ai(prompt: str, model: str = DEFAULT_MODEL) -> str:
    """Send a prompt to the Groq API and return the response."""
    try:
        client = _get_client()
        response = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model=model,
        )
        return response.choices[0].message.content or ""
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI engine error: {str(e)}")


def ask_ai_with_model(prompt: str, model: str) -> str:
    """Same as ask_ai but always uses the specified model (for benchmarking)."""
    return ask_ai(prompt, model=model)


def check_groq_status() -> dict:
    """Check whether the Groq API key is configured."""
    if not GROQ_API_KEY:
        return {
            "running": False,
            "models": [],
            "message": "GROQ_API_KEY environment variable is not set.",
        }
    return {"running": True, "models": AVAILABLE_MODELS}


def list_available_models() -> list:
    """Return list of available Groq models."""
    return check_groq_status().get("models", [])
