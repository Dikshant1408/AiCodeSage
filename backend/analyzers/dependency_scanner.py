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
        if not line or line.startswith("#") or line.startswith("-"):
            continue
        # Handle extras: package[extra]==1.0.0 → name=package, version=1.0.0
        m = re.match(r'^([A-Za-z0-9_\-\.]+)(?:\[[^\]]*\])?\s*[=~><]+\s*([^\s;#,]+)', line)
        if m:
            packages.append({"name": m.group(1), "version": m.group(2)})
        else:
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


def _fetch_vuln_details(vuln_id: str) -> dict:
    """Fetch full details for a single CVE from OSV."""
    try:
        resp = _requests.get(
            f"https://api.osv.dev/v1/vulns/{vuln_id}",
            timeout=8,
        )
        if resp.status_code == 200:
            return resp.json()
    except Exception:
        pass
    return {}


def check_osv(packages: List[Dict[str, str]], ecosystem: str) -> List[Vulnerability]:
    """Query OSV API for vulnerabilities. Returns list of Vulnerability."""
    if not _HAS_REQUESTS or not packages:
        return []

    # Step 1: batch query to get vuln IDs
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
        batch_data = resp.json()
    except Exception:
        return []

    # Collect all (pkg_index, vuln_id) pairs
    id_pairs = []
    for i, result in enumerate(batch_data.get("results", [])):
        for vuln in result.get("vulns", []):
            vid = vuln.get("id", "")
            if vid:
                id_pairs.append((i, vid))

    if not id_pairs:
        return []

    # Step 2: fetch full details for each CVE in parallel
    from concurrent.futures import ThreadPoolExecutor, as_completed
    details_map = {}
    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = {ex.submit(_fetch_vuln_details, vid): (idx, vid) for idx, vid in id_pairs}
        for fut in as_completed(futures):
            idx, vid = futures[fut]
            details_map[(idx, vid)] = fut.result()

    # Step 3: build Vulnerability objects with real descriptions
    vulns = []
    for idx, vid in id_pairs:
        pkg = packages[idx]
        detail = details_map.get((idx, vid), {})

        # Severity from CVSS
        severity = "MEDIUM"
        for sev in detail.get("severity", []):
            raw_score = sev.get("score", "")
            try:
                # CVSS vector like "CVSS:3.1/AV:N/AC:H/..." — extract base score
                if "CVSS" in raw_score:
                    # Calculate from vector or use database score
                    parts = raw_score.split("/")
                    # Try to find AV, AC etc. for rough scoring
                    # Simpler: use the type to determine severity
                    sev_type = sev.get("type", "")
                    if "CRITICAL" in sev_type.upper():
                        severity = "CRITICAL"
                    elif "HIGH" in sev_type.upper():
                        severity = "HIGH"
                else:
                    score = float(raw_score)
                    if score >= 9.0:   severity = "CRITICAL"
                    elif score >= 7.0: severity = "HIGH"
                    elif score >= 4.0: severity = "MEDIUM"
                    else:              severity = "LOW"
            except (ValueError, TypeError):
                pass

        # Also check database_specific severity
        for db in detail.get("database_specific", {}).get("severity", []):
            sev_map = {"CRITICAL": "CRITICAL", "HIGH": "HIGH", "MODERATE": "MEDIUM", "LOW": "LOW"}
            if isinstance(db, str) and db.upper() in sev_map:
                severity = sev_map[db.upper()]
                break

        # Description
        description = (
            detail.get("summary") or
            (detail.get("details", "")[:300].split("\n")[0] if detail.get("details") else "") or
            "No description available"
        ).strip()

        # Fixed version
        fixed = ""
        for affected in detail.get("affected", []):
            for rng in affected.get("ranges", []):
                for event in rng.get("events", []):
                    if "fixed" in event:
                        fixed = event["fixed"]
                        break
                if fixed:
                    break
            if fixed:
                break

        vulns.append(Vulnerability(
            package=pkg["name"],
            version=pkg["version"] or "unpinned",
            vuln_id=vid,
            severity=severity,
            summary=description,
            fixed_version=fixed,
        ))

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
