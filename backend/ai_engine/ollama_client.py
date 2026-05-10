import os
from fastapi import HTTPException

DEFAULT_MODEL = "llama-3.1-8b-instant"

_groq_client = None
_groq_key_used = None   # track which key the client was built with


def _get_client():
    global _groq_client, _groq_key_used
    api_key = os.environ.get("GROQ_API_KEY", "")
    if not api_key:
        raise HTTPException(status_code=503, detail="GROQ_API_KEY not set in .env")
    # Rebuild client if key changed (e.g. after .env update + hot reload)
    if _groq_client is None or api_key != _groq_key_used:
        try:
            from groq import Groq
        except ImportError:
            raise HTTPException(status_code=503, detail="groq package not installed. Run: pip install groq")
        _groq_client = Groq(api_key=api_key)
        _groq_key_used = api_key
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
        # Reset client so next call tries fresh with current key
        global _groq_client, _groq_key_used
        _groq_client = None
        _groq_key_used = None
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
