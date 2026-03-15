"""
Language detection + engine registry.
Maps file extensions → analyzer engine.
"""
from pathlib import Path


class EngineCreationError(Exception):
    """Raised when a language engine cannot be imported or instantiated."""


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
    ext = Path(filename).suffix.lstrip(".").lower()
    return EXTENSION_MAP.get(ext, "unknown")

def _import_and_create(module_path: str, class_name: str, language: str, *args):
    """Import a language engine class and return an instance, raising EngineCreationError on failure."""
    try:
        import importlib
        module = importlib.import_module(module_path)
    except ImportError as e:
        raise EngineCreationError(f"Failed to import engine for {language}: {e}") from e
    try:
        return getattr(module, class_name)(*args)
    except Exception as e:
        raise EngineCreationError(f"Failed to create engine for {language}: {e}") from e


def get_engine(language: str):
    """Return the analyzer engine for a language."""
    if language == "python":
        return _import_and_create("language_engines.python.engine", "PythonEngine", language)
    elif language in ("javascript", "typescript"):
        return _import_and_create("language_engines.javascript.engine", "JavaScriptEngine", language, language)
    elif language == "java":
        return _import_and_create("language_engines.java.engine", "JavaEngine", language)
    else:
        try:
            from language_engines.base import GenericEngine
            return GenericEngine(language)
        except Exception as e:
            raise EngineCreationError(f"Failed to create engine for {language}: {e}") from e
