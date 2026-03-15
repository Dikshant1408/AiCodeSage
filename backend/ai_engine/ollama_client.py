import os
from fastapi import HTTPException

# Groq client (falls back gracefully if not installed)
try:
    from groq import Groq
    _groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY", ""))
except ImportError:
    _groq_client = None

DEFAULT_MODEL = "llama-3.1-8b-instant"

def ask_ai(prompt: str, model: str = DEFAULT_MODEL) -> str:
    """Send a prompt to Groq and return the response."""
    if _groq_client is None:
        raise HTTPException(status_code=503, detail="groq package not installed. Run: pip install groq")
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY environment variable not set.")
    try:
        completion = _groq_client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2048,
            temperature=0.2,
        )
        return completion.choices[0].message.content or ""
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq AI error: {str(e)}")


def ask_ai_with_model(prompt: str, model: str) -> str:
    """Same as ask_ai but always uses the specified model (for benchmarking)."""
    return ask_ai(prompt, model=model)


def list_available_models() -> list:
    """Return list of available Groq models."""
    return [
        "llama-3.1-8b-instant",
        "llama-3.1-70b-versatile",
        "llama3-8b-8192",
        "llama3-70b-8192",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
    ]
