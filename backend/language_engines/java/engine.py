"""Java language engine — regex-based analysis."""
import re
from language_engines.base import BaseEngine, EngineResult


class JavaEngine(BaseEngine):
    language = "java"

    def analyze(self, code: str, filename: str = "Code.java") -> EngineResult:
        result = self._make_result("java")
        lines = code.splitlines()
        result.metrics = {"lines": len(lines), "blank_lines": sum(1 for l in lines if not l.strip())}

        # Classes
        result.classes = re.findall(r'(?:public|private|protected)?\s*class\s+(\w+)', code)

        # Methods
        result.functions = re.findall(
            r'(?:public|private|protected|static|final|synchronized)\s+(?:\w+\s+)+(\w+)\s*\([^)]*\)\s*(?:throws\s+\w+\s*)?\{',
            code
        )
        result.functions = list(dict.fromkeys(result.functions))[:30]

        # Imports
        result.imports = re.findall(r'import\s+([\w.]+);', code)

        # Static checks
        issues = []
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if re.search(r'System\.out\.print', stripped):
                issues.append({"line": i, "severity": "info", "message": "Use a logger instead of System.out", "rule": "java:S106"})
            if re.search(r'catch\s*\(\s*Exception\s+', stripped):
                issues.append({"line": i, "severity": "warning", "message": "Avoid catching generic Exception", "rule": "java:S2221"})
            if re.search(r'password\s*=\s*"[^"]+"', stripped, re.IGNORECASE):
                issues.append({"line": i, "severity": "error", "message": "Hardcoded password", "rule": "java:S2068"})
            if re.search(r'\.equals\(null\)', stripped):
                issues.append({"line": i, "severity": "error", "message": "Use == null instead of .equals(null)", "rule": "java:S2159"})
            if re.search(r'new\s+\w+\s*\(\s*\)\s*;', stripped) and "String" in stripped:
                issues.append({"line": i, "severity": "info", "message": "Prefer string literals over new String()", "rule": "java:S1858"})

        result.static_issues = issues
        result.metrics["functions"] = len(result.functions)
        result.metrics["classes"] = len(result.classes)
        result.raw_output = f"Found {len(issues)} static issues"
        return result
