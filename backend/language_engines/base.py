"""Base engine interface — all language engines implement this."""
from dataclasses import dataclass, field
from typing import List, Dict

@dataclass
class EngineResult:
    language: str
    functions: List[str] = field(default_factory=list)
    classes: List[str] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)
    static_issues: List[Dict] = field(default_factory=list)  # [{line, severity, message, rule}]
    metrics: Dict = field(default_factory=dict)              # {lines, functions, complexity}
    raw_output: str = ""

class BaseEngine:
    language = "unknown"

    def analyze(self, code: str, filename: str = "code") -> EngineResult:
        raise NotImplementedError

    def _make_result(self, language: str) -> EngineResult:
        return EngineResult(language=language)


class GenericEngine(BaseEngine):
    """Fallback engine for unsupported languages — AI-only analysis."""
    def __init__(self, language: str):
        self.language = language

    def analyze(self, code: str, filename: str = "code") -> EngineResult:
        import re
        result = self._make_result(self.language)
        lines = code.splitlines()
        result.metrics = {
            "lines": len(lines),
            "blank_lines": sum(1 for l in lines if not l.strip()),
            "comment_lines": sum(1 for l in lines if l.strip().startswith(("//"," *","#","--"))),
        }
        # Generic function detection via regex
        fn_patterns = [
            r'(?:function|def|func|fn)\s+(\w+)\s*\(',
            r'(?:public|private|protected|static).*?(\w+)\s*\([^)]*\)\s*\{',
        ]
        for pat in fn_patterns:
            result.functions += re.findall(pat, code)
        result.functions = list(dict.fromkeys(result.functions))[:20]
        return result
