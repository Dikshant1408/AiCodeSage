import os
from fastapi import HTTPException

DEFAULT_MODEL = "llama-3.1-8b-instant"

# Lazy singleton — created once on first real call, after dotenv is loaded
_groq_client = None

def _get_client():
    global _groq_client
    if _groq_client is not None:
        return _groq_client
    try:
        from groq import Groq
    except ImportError:
        raise HTTPException(status_code=503, detail="groq package not installed. Run: pip install groq")
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY not set in .env")
    _groq_client = Groq(api_key=api_key)
    return _groq_client


def ask_ai(prompt: str, model: str = DEFAULT_MODEL) -> str:
    client = _get_client()
    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2048,
            temperature=0.2,
        )
        return completion.choices[0].message.content or ""
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq AI error: {str(e)}")


def ask_ai_with_model(prompt: str, model: str) -> str:
    return ask_ai(prompt, model=model)


def list_available_models() -> list:
    return [
        "llama-3.1-8b-instant",
        "llama-3.1-70b-versatile",
        "llama3-8b-8192",
        "llama3-70b-8192",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
    ]
