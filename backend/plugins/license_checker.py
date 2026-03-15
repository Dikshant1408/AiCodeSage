"""Example plugin: checks for license header in files."""
from analyzers.plugin_system import AnalyzerPlugin


class LicenseCheckerPlugin(AnalyzerPlugin):
    name = "license_checker"
    description = "Checks that files have a license header"
    version = "1.0.0"

    LICENSE_KEYWORDS = ["license", "copyright", "mit", "apache", "gpl", "bsd"]

    def analyze(self, code: str, filename: str = "code", language: str = "python") -> dict:
        first_200 = code[:200].lower()
        has_license = any(kw in first_200 for kw in self.LICENSE_KEYWORDS)
        issues = []
        if not has_license:
            issues.append({
                "line": 1,
                "severity": "info",
                "message": "No license header found at top of file",
                "rule": "require-license-header",
            })
        return {"issues": issues, "metrics": {"has_license": int(has_license)}}
