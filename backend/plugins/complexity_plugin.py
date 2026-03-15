"""Example plugin: flags functions longer than 50 lines."""
import re
from analyzers.plugin_system import AnalyzerPlugin


class ComplexityPlugin(AnalyzerPlugin):
    name = "complexity_checker"
    description = "Flags functions longer than 50 lines"
    version = "1.0.0"

    def analyze(self, code: str, filename: str = "code", language: str = "python") -> dict:
        issues = []
        lines = code.splitlines()
        # Simple heuristic: find def/function blocks
        for i, line in enumerate(lines):
            if re.match(r'\s*def\s+\w+', line) or re.match(r'\s*function\s+\w+', line):
                # Count lines until next same-level def or end
                indent = len(line) - len(line.lstrip())
                count = 0
                for j in range(i + 1, len(lines)):
                    next_line = lines[j]
                    if next_line.strip() == "":
                        continue
                    next_indent = len(next_line) - len(next_line.lstrip())
                    if next_indent <= indent and next_line.strip():
                        break
                    count += 1
                if count > 50:
                    issues.append({
                        "line": i + 1,
                        "severity": "warning",
                        "message": f"Function is {count} lines long (>50). Consider splitting.",
                        "rule": "max-function-length",
                    })
        return {"issues": issues, "metrics": {"long_functions": len(issues)}}
