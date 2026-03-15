"""Python language engine — AST + pylint + bandit + flake8."""
import ast, re
from language_engines.base import BaseEngine, EngineResult
from analyzers.static_analyzer import run_pylint, run_bandit, run_flake8


class PythonEngine(BaseEngine):
    language = "python"

    def analyze(self, code: str, filename: str = "code.py") -> EngineResult:
        if not isinstance(filename, str) or not filename.endswith(".py"):
            raise ValueError("filename must be a non-empty string ending with '.py'")

        result = self._make_result("python")
        lines = code.splitlines()
        result.metrics = {"lines": len(lines), "blank_lines": sum(1 for l in lines if not l.strip())}

        try:
            tree = ast.parse(code)
            self._parse_ast(tree, result)
        except SyntaxError as e:
            result.static_issues.append({"line": e.lineno, "severity": "error", "message": str(e), "rule": "syntax"})

        # Static analysis
        pylint_out = run_pylint(code)
        bandit_out = run_bandit(code)
        flake8_out = run_flake8(code)
        result.raw_output = f"pylint:\n{pylint_out}\n\nbandit:\n{bandit_out}\n\nflake8:\n{flake8_out}"

        # Parse pylint issues
        self._parse_pylint_issues(pylint_out, result)

        result.metrics["functions"] = len(result.functions)
        result.metrics["classes"] = len(result.classes)
        return result

    def _parse_ast(self, tree: ast.AST, result: EngineResult):
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                result.functions.append(node.name)
            elif isinstance(node, ast.ClassDef):
                result.classes.append(node.name)
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    result.imports.append(alias.name)
            elif isinstance(node, ast.ImportFrom):
                result.imports.append(node.module or "")

    def _parse_pylint_issues(self, pylint_out: str, result: EngineResult):
        for line in pylint_out.splitlines():
            m = re.match(r".*:(\d+):\d+: ([CWEF])\d+: (.+?) \((.+?)\)", line)
            if m:
                sev_map = {"C": "info", "W": "warning", "E": "error", "F": "error"}
                result.static_issues.append({
                    "line": int(m.group(1)), "severity": sev_map.get(m.group(2), "info"),
                    "message": m.group(3), "rule": m.group(4),
                })
