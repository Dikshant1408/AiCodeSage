"""JavaScript/TypeScript language engine — regex-based analysis."""
import re, subprocess, tempfile, os
from language_engines.base import BaseEngine, EngineResult


class JavaScriptEngine(BaseEngine):
    def __init__(self, language: str = "javascript"):
        self.language = language

    def analyze(self, code: str, filename: str = "code.js") -> EngineResult:
        result = self._make_result(self.language)
        lines = code.splitlines()
        result.metrics = {"lines": len(lines), "blank_lines": sum(1 for l in lines if not l.strip())}

        # Functions
        fn_patterns = [
            r'(?:function\s+)(\w+)\s*\(',
            r'(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\(',
            r'(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?function',
            r'(\w+)\s*\([^)]*\)\s*\{',
        ]
        for pat in fn_patterns:
            result.functions += re.findall(pat, code)
        result.functions = list(dict.fromkeys(result.functions))[:30]

        # Classes
        result.classes = re.findall(r'class\s+(\w+)', code)

        # Imports
        result.imports = re.findall(r'(?:import|require)\s*[({]?\s*["\']([^"\']+)["\']', code)

        # Basic static checks
        issues = []
        for i, line in enumerate(lines, 1):
            stripped = line.strip()
            if re.search(r'\beval\s*\(', stripped):
                issues.append({"line": i, "severity": "error", "message": "Unsafe eval() usage", "rule": "no-eval"})
            if re.search(r'console\.log\(', stripped):
                issues.append({"line": i, "severity": "info", "message": "console.log left in code", "rule": "no-console"})
            if re.search(r'==(?!=)', stripped):
                issues.append({"line": i, "severity": "warning", "message": "Use === instead of ==", "rule": "eqeqeq"})
            if re.search(r'\bvar\b', stripped):
                issues.append({"line": i, "severity": "info", "message": "Prefer const/let over var", "rule": "no-var"})
            if re.search(r'password\s*=\s*["\'][^"\']+["\']', stripped, re.IGNORECASE):
                issues.append({"line": i, "severity": "error", "message": "Hardcoded password detected", "rule": "no-hardcoded-secrets"})

        result.static_issues = issues
        result.metrics["functions"] = len(result.functions)
        result.metrics["classes"] = len(result.classes)
        result.raw_output = f"Found {len(issues)} static issues"
        return result
