"""
Repository Intelligence API
============================
POST /api/repo/analyze-zip   — upload ZIP, get full repo intelligence report
POST /api/repo/analyze-github — GitHub URL, get full repo intelligence report
GET  /api/repo/recurring/{repo_name} — recurring issues across analysis history
"""
import io, zipfile, uuid, time
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from dataclasses import asdict

from analyzers.repo_intelligence import analyze_repository
from analyzers.analytics_db import save_analysis, get_history, init_db
from analyzers.github_analyzer import clone_and_scan

router = APIRouter()

SUPPORTED = (".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".css", ".scss", ".html", ".sql")
MAX_FILES = 60

SKIP_DIRS = ("node_modules", "venv", ".venv", "dist", "build", ".git",
             "__pycache__", ".next", "coverage", "vendor", "target")


# ── ZIP upload ────────────────────────────────────────────────────────────────

@router.post("/analyze-zip")
async def analyze_zip(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        zf = zipfile.ZipFile(io.BytesIO(contents))
    except zipfile.BadZipFile:
        return {"error": "Invalid ZIP file"}

    files = {}
    for name in zf.namelist():
        # Skip heavy/irrelevant directories
        parts = name.replace("\\", "/").split("/")
        if any(skip in parts for skip in SKIP_DIRS):
            continue
        if name.endswith(SUPPORTED) and not name.endswith("/"):
            code = zf.read(name).decode("utf-8", errors="ignore").strip()
            if code and len(code) > 20:  # skip empty/tiny files
                files[name] = code
    zf.close()

    if not files:
        return {"error": "No supported source files found (.py .js .ts .jsx .tsx .java)"}

    # Cap at MAX_FILES — prioritize Python files
    py = {k: v for k, v in files.items() if k.endswith(".py")}
    other = {k: v for k, v in files.items() if not k.endswith(".py")}
    files = dict(list(py.items())[:MAX_FILES] + list(other.items())[:max(0, MAX_FILES - len(py))])

    t0 = time.time()
    report = analyze_repository(files)
    duration = round(time.time() - t0, 1)

    # Save to history
    repo_name = file.filename.replace(".zip", "") or "uploaded-project"
    _save_to_history(repo_name, report)

    return {**asdict(report), "repo_name": repo_name, "duration_sec": duration}


# ── GitHub URL ────────────────────────────────────────────────────────────────

class GithubRepoRequest(BaseModel):
    repo_url: str

@router.post("/analyze-github")
def analyze_github_repo(req: GithubRepoRequest):
    try:
        files = clone_and_scan(req.repo_url)
    except Exception as e:
        return {"error": f"Failed to clone: {e}"}

    if not files:
        return {"error": "No supported source files found"}

    py = {k: v for k, v in files.items() if k.endswith(".py")}
    other = {k: v for k, v in files.items() if not k.endswith(".py")}
    files = dict(list(py.items())[:MAX_FILES] + list(other.items())[:max(0, MAX_FILES - len(py))])

    t0 = time.time()
    report = analyze_repository(files)
    duration = round(time.time() - t0, 1)

    repo_name = req.repo_url.rstrip("/").split("/")[-1]
    _save_to_history(repo_name, report)

    return {**asdict(report), "repo_name": repo_name, "repo_url": req.repo_url, "duration_sec": duration}


# ── Recurring issues ──────────────────────────────────────────────────────────

@router.get("/recurring/{repo_name}")
def recurring_issues(repo_name: str):
    """
    Queries SQLite history to find issues that keep appearing across analyses.
    Pure SQL — no AI. Proves the system learns your codebase over time.
    """
    import sqlite3, os
    from analyzers.analytics_db import DB_PATH
    init_db()

    try:
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row

        # Get all analyses for this repo
        rows = conn.execute("""
            SELECT quality_score, bug_count, security_count, code_smells,
                   grade, files_analyzed, timestamp
            FROM analysis_history
            WHERE repo_id LIKE ?
            ORDER BY timestamp ASC
        """, (f"%{repo_name}%",)).fetchall()
        conn.close()
    except Exception as e:
        return {"error": str(e), "analyses": [], "insights": []}

    if len(rows) < 2:
        return {
            "analyses": len(rows),
            "insights": [],
            "message": "Need at least 2 analyses to detect recurring issues. Run the repo analyzer again after making changes.",
        }

    analyses = [dict(r) for r in rows]

    # Detect recurring patterns
    insights = []

    # Consistently high bug count
    bug_counts = [r["bug_count"] for r in analyses if r["bug_count"] is not None]
    if bug_counts and sum(1 for b in bug_counts if b > 3) >= len(bug_counts) * 0.6:
        avg = round(sum(bug_counts) / len(bug_counts), 1)
        insights.append({
            "type": "recurring_bugs",
            "severity": "high",
            "message": f"Bug count has been consistently high (avg {avg}) across {len(analyses)} analyses.",
            "recommendation": "Focus on fixing pylint E-code errors — they represent real bugs, not style issues.",
            "data": bug_counts,
        })

    # Security issues not being fixed
    sec_counts = [r["security_count"] for r in analyses if r["security_count"] is not None]
    if sec_counts and sec_counts[-1] >= sec_counts[0]:
        insights.append({
            "type": "unresolved_security",
            "severity": "critical",
            "message": f"Security issues have not decreased across {len(analyses)} analyses (started: {sec_counts[0]}, now: {sec_counts[-1]}).",
            "recommendation": "Run the Taint Path Visualizer to find exact injection paths and fix them.",
            "data": sec_counts,
        })

    # Quality score trend
    scores = [r["quality_score"] for r in analyses if r["quality_score"] is not None]
    if len(scores) >= 3:
        trend = scores[-1] - scores[0]
        if trend < -1:
            insights.append({
                "type": "declining_quality",
                "severity": "high",
                "message": f"Quality score has declined by {abs(round(trend, 1))} points over {len(analyses)} analyses.",
                "recommendation": "Run the Autonomous Pipeline to auto-fix the worst-scoring files.",
                "data": scores,
            })
        elif trend > 1:
            insights.append({
                "type": "improving_quality",
                "severity": "info",
                "message": f"Quality score has improved by {round(trend, 1)} points over {len(analyses)} analyses. Keep going.",
                "recommendation": "Focus next on security issues — they have the highest score impact.",
                "data": scores,
            })

    # Code smells accumulating
    smells = [r["code_smells"] for r in analyses if r["code_smells"] is not None]
    if smells and len(smells) >= 2 and smells[-1] > smells[0] * 1.5:
        insights.append({
            "type": "accumulating_smells",
            "severity": "medium",
            "message": f"Code smells have grown {round(smells[-1]/max(smells[0],1), 1)}x since first analysis.",
            "recommendation": "Run Duplicate Detector and Complexity Refactor to reduce technical debt.",
            "data": smells,
        })

    return {
        "repo_name": repo_name,
        "analyses_count": len(analyses),
        "analyses": analyses,
        "insights": insights,
        "score_trend": scores if scores else [],
    }


# ── Helper ────────────────────────────────────────────────────────────────────

def _save_to_history(repo_name: str, report):
    try:
        taint_count = len(report.cross_file_taint)
        save_analysis(
            repo_id=repo_name,
            quality_score=report.avg_quality_score,
            bug_count=sum(f.get("bugs", 0) for f in report.file_scores),
            security_count=sum(f.get("security", 0) for f in report.file_scores) + taint_count,
            code_smells=sum(f.get("smells", 0) for f in report.file_scores),
            grade=report.avg_grade,
            files_analyzed=report.total_files,
            line_count=report.total_lines,
        )
    except Exception:
        pass
