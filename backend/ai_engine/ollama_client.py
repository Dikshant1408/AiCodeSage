import requests
from fastapi import HTTPException

OLLAMA_URL = "http://localhost:11434/api/generate"
DEFAULT_MODEL = "deepseek-coder"

def ask_ai(prompt: str, model: str = DEFAULT_MODEL) -> str:
    """Send a prompt to the local Ollama model and return the response."""
    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": model, "prompt": prompt, "stream": False},
            timeout=120,
        )
        if response.status_code == 404:
            raise HTTPException(
                status_code=503,
                detail=f"Model '{model}' not found. Run: ollama pull {model}"
            )
        response.raise_for_status()
        return response.json().get("response", "")
    except requests.exceptions.ConnectionError:
        raise HTTPException(
            status_code=503,
            detail="Ollama is not running. Start it with: ollama serve"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI engine error: {str(e)}")


def ask_ai_with_model(prompt: str, model: str) -> str:
    """Same as ask_ai but always uses the specified model (for benchmarking)."""
    return ask_ai(prompt, model=model)


def list_available_models() -> list:
    """Return list of locally available Ollama models."""
    try:
        resp = requests.get("http://localhost:11434/api/tags", timeout=10)
        if resp.status_code == 200:
            return [m["name"] for m in resp.json().get("models", [])]
    except Exception:
        pass
    return []
