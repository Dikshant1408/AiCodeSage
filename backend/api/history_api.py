"""
User Project History API
========================
Stores every project a user has analyzed — per user, persistent across sessions.
GET  /api/history/          — list all projects for current user
POST /api/history/save      — save a project analysis
GET  /api/history/{id}      — get a specific project's details
DELETE /api/history/{id}    — delete a project from history
"""
import sqlite3, json, os, time
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from api.auth import get_current_user

router = APIRouter()

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "users.db")


def _db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def _init():
    with _db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS project_history (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id     INTEGER NOT NULL,
                repo_name   TEXT NOT NULL,
                source      TEXT DEFAULT 'zip',   -- zip | github | manual
                repo_url    TEXT DEFAULT '',
                avg_score   REAL DEFAULT 0,
                grade       TEXT DEFAULT 'C',
                total_files INTEGER DEFAULT 0,
                total_lines INTEGER DEFAULT 0,
                issue_count INTEGER DEFAULT 0,
                vuln_count  INTEGER DEFAULT 0,
                stack       TEXT DEFAULT '[]',     -- JSON array
                summary     TEXT DEFAULT '',       -- AI plain-English summary
                report_data TEXT DEFAULT '{}',     -- full report JSON (compressed)
                created_at  TEXT NOT NULL
            )
        """)
        conn.commit()

_init()


# ── Models ────────────────────────────────────────────────────────────────────

class SaveProjectRequest(BaseModel):
    repo_name: str
    source: str = "zip"          # zip | github | manual
    repo_url: str = ""
    avg_score: float = 0
    grade: str = "C"
    total_files: int = 0
    total_lines: int = 0
    issue_count: int = 0
    vuln_count: int = 0
    stack: list = []
    summary: str = ""
    report_data: dict = {}


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.get("/")
def list_projects(user=Depends(get_current_user)):
    with _db() as conn:
        rows = conn.execute("""
            SELECT id, repo_name, source, repo_url, avg_score, grade,
                   total_files, total_lines, issue_count, vuln_count,
                   stack, summary, created_at
            FROM project_history
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        """, (user["sub"],)).fetchall()
    return {"projects": [dict(r) for r in rows]}


@router.post("/save")
def save_project(req: SaveProjectRequest, user=Depends(get_current_user)):
    now = time.strftime("%Y-%m-%dT%H:%M:%S")
    with _db() as conn:
        cur = conn.execute("""
            INSERT INTO project_history
            (user_id, repo_name, source, repo_url, avg_score, grade,
             total_files, total_lines, issue_count, vuln_count,
             stack, summary, report_data, created_at)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            user["sub"], req.repo_name, req.source, req.repo_url,
            req.avg_score, req.grade, req.total_files, req.total_lines,
            req.issue_count, req.vuln_count,
            json.dumps(req.stack), req.summary,
            json.dumps(req.report_data), now,
        ))
        conn.commit()
        project_id = cur.lastrowid
    return {"saved": True, "id": project_id}


@router.get("/{project_id}")
def get_project(project_id: int, user=Depends(get_current_user)):
    with _db() as conn:
        row = conn.execute(
            "SELECT * FROM project_history WHERE id=? AND user_id=?",
            (project_id, user["sub"])
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Project not found")
    data = dict(row)
    try:
        data["stack"] = json.loads(data["stack"])
        data["report_data"] = json.loads(data["report_data"])
    except Exception:
        pass
    return data


@router.delete("/{project_id}")
def delete_project(project_id: int, user=Depends(get_current_user)):
    with _db() as conn:
        conn.execute(
            "DELETE FROM project_history WHERE id=? AND user_id=?",
            (project_id, user["sub"])
        )
        conn.commit()
    return {"deleted": True}
