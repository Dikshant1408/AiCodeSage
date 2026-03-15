"""
Language detection + engine registry.
Maps file extensions → analyzer engine.
"""
from typing import Optional

EXTENSION_MAP = {
    "py":   "python",
    "js":   "javascript",
    "jsx":  "javascript",
    "ts":   "typescript",
    "tsx":  "typescript",
    "java": "java",
    "go":   "go",
    "rb":   "ruby",
    "php":  "php",
    "cs":   "csharp",
    "cpp":  "cpp",
    "c":    "c",
    "rs":   "rust",
    "kt":   "kotlin",
    "swift":"swift",
}

def detect_language(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return EXTENSION_MAP.get(ext, "unknown")

def get_engine(language: str):
    """Return the analyzer engine for a language."""
    if language == "python":
        from language_engines.python.engine import PythonEngine
        return PythonEngine()
    elif language in ("javascript", "typescript"):
        from language_engines.javascript.engine import JavaScriptEngine
        return JavaScriptEngine(language)
    elif language == "java":
        from language_engines.java.engine import JavaEngine
        return JavaEngine()
    else:
        from language_engines.base import GenericEngine
        return GenericEngine(language)
