"""
Dependency & Supply Chain Security Scanner.
Parses requirements.txt / package.json and checks for known vulnerabilities
using the OSV (Open Source Vulnerabilities) API — free, no key needed.
"""
import re, json
from typing import List, Dict
from dataclasses import dataclass, field

try:
    import requests as _requests
    _HAS_REQUESTS = True
except ImportError:
    _HAS_REQUESTS = False


@dataclass
class Vulnerability:
    package: str
    version: str
    vuln_id: str
    severity: str
    summary: str
    fixed_version: str = ""


@dataclass
class DependencyScanResult:
    ecosystem: str
    packages_scanned: int
    vulnerabilities: List[Vulnerability] = field(default_factory=list)
    safe_packages: List[str] = field(default_factory=list)
    error: str = ""


def parse_requirements_txt(content: str) -> List[Dict[str, str]]:
    """Parse requirements.txt into [{name, version}]."""
    packages = []
    for line in content.splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        # Handle: package==1.0.0, package>=1.0.0, package~=1.0.0
        m = re.match(r'^([A-Za-z0-9_\-\.]+)\s*[=~><]+\s*([^\s;#]+)', line)
        if m:
            packages.append({"name": m.group(1), "version": m.group(2)})
        else:
            # No version pinned
            name = re.match(r'^([A-Za-z0-9_\-\.]+)', line)
            if name:
                packages.append({"name": name.group(1), "version": ""})
    return packages


def parse_package_json(content: str) -> List[Dict[str, str]]:
    """Parse package.json dependencies into [{name, version}]."""
    packages = []
    try:
        data = json.loads(content)
        for section in ("dependencies", "devDependencies"):
            for name, ver in data.get(section, {}).items():
                # Strip ^, ~, >=, etc.
                clean_ver = re.sub(r'^[^0-9]*', '', ver)
                packages.append({"name": name, "version": clean_ver})
    except Exception:
        pass
    return packages


def check_osv(packages: List[Dict[str, str]], ecosystem: str) -> List[Vulnerability]:
    """Query OSV API for vulnerabilities. Returns list of Vulnerability."""
    if not _HAS_REQUESTS or not packages:
        return []

    vulns = []
    # OSV batch query
    queries = []
    for pkg in packages:
        if pkg["version"]:
            queries.append({
                "version": pkg["version"],
                "package": {"name": pkg["name"], "ecosystem": ecosystem},
            })
        else:
            queries.append({"package": {"name": pkg["name"], "ecosystem": ecosystem}})

    try:
        resp = _requests.post(
            "https://api.osv.dev/v1/querybatch",
            json={"queries": queries},
            timeout=15,
        )
        if resp.status_code != 200:
            return []

        data = resp.json()
        for i, result in enumerate(data.get("results", [])):
            pkg = packages[i]
            for vuln in result.get("vulns", []):
                severity = "MEDIUM"
                for sev in vuln.get("severity", []):
                    if sev.get("type") == "CVSS_V3":
                        score = float(sev.get("score", "0").split("/")[0] if "/" in sev.get("score", "") else sev.get("score", 0))
                        if score >= 9.0:
                            severity = "CRITICAL"
                        elif score >= 7.0:
                            severity = "HIGH"
                        elif score >= 4.0:
                            severity = "MEDIUM"
                        else:
                            severity = "LOW"

                # Find fixed version
                fixed = ""
                for affected in vuln.get("affected", []):
                    for rng in affected.get("ranges", []):
                        for event in rng.get("events", []):
                            if "fixed" in event:
                                fixed = event["fixed"]
                                break

                vulns.append(Vulnerability(
                    package=pkg["name"],
                    version=pkg["version"],
                    vuln_id=vuln.get("id", ""),
                    severity=severity,
                    summary=vuln.get("summary", "No description")[:200],
                    fixed_version=fixed,
                ))
    except Exception as e:
        pass

    return vulns


def scan_dependencies(content: str, filename: str) -> DependencyScanResult:
    """Main entry point — detect file type and scan."""
    fname = filename.lower()

    if "requirements" in fname and fname.endswith(".txt"):
        packages = parse_requirements_txt(content)
        ecosystem = "PyPI"
    elif fname == "package.json":
        packages = parse_package_json(content)
        ecosystem = "npm"
    else:
        return DependencyScanResult(ecosystem="unknown", packages_scanned=0, error="Unsupported file type")

    vulns = check_osv(packages, ecosystem)
    vuln_names = {v.package for v in vulns}
    safe = [p["name"] for p in packages if p["name"] not in vuln_names]

    return DependencyScanResult(
        ecosystem=ecosystem,
        packages_scanned=len(packages),
        vulnerabilities=vulns,
        safe_packages=safe,
    )
