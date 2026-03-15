"""
Historical code quality analytics — SQLite-backed.
Tracks quality scores, bug counts, security issues over time per repo.
"""
import sqlite3, json, hashlib, os
from datetime import datetime
from dataclasses import dataclass, field
from typing import List, Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "analytics.db")


def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with _get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS analysis_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                repo_id TEXT NOT NULL,
                commit_hash TEXT,
                quality_score REAL,
                bug_count INTEGER,
                security_count INTEGER,
                code_smells INTEGER,
                complexity TEXT,
                grade TEXT,
                files_analyzed INTEGER,
                line_count INTEGER,
                timestamp TEXT NOT NULL,
                metadata TEXT
            )
        """)
        conn.commit()


@dataclass
class HistoryEntry:
    repo_id: str
    quality_score: float
    bug_count: int
    security_count: int
    code_smells: int
    grade: str
    timestamp: str
    files_analyzed: int = 0
    line_count: int = 0
    commit_hash: str = ""
    complexity: str = ""
    id: int = 0


def save_analysis(
    repo_id: str,
    quality_score: float,
    bug_count: int,
    security_count: int,
    code_smells: int,
    grade: str,
    files_analyzed: int = 0,
    line_count: int = 0,
    commit_hash: str = "",
    complexity: str = "",
    metadata: dict = None,
):
    init_db()
    with _get_conn() as conn:
        conn.execute("""
            INSERT INTO analysis_history
            (repo_id, commit_hash, quality_score, bug_count, security_count,
             code_smells, complexity, grade, files_analyzed, line_count, timestamp, metadata)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            repo_id, commit_hash, quality_score, bug_count, security_count,
            code_smells, complexity, grade, files_analyzed, line_count,
            datetime.utcnow().isoformat(), json.dumps(metadata or {}),
        ))
        conn.commit()


def get_history(repo_id: str, limit: int = 30) -> List[HistoryEntry]:
    init_db()
    with _get_conn() as conn:
        rows = conn.execute("""
            SELECT * FROM analysis_history
            WHERE repo_id = ?
            ORDER BY timestamp DESC LIMIT ?
        """, (repo_id, limit)).fetchall()
    return [HistoryEntry(
        id=r["id"], repo_id=r["repo_id"], commit_hash=r["commit_hash"] or "",
        quality_score=r["quality_score"], bug_count=r["bug_count"],
        security_count=r["security_count"], code_smells=r["code_smells"],
        grade=r["grade"], files_analyzed=r["files_analyzed"],
        line_count=r["line_count"], timestamp=r["timestamp"],
        complexity=r["complexity"] or "",
    ) for r in rows]


def get_all_repos() -> List[str]:
    init_db()
    with _get_conn() as conn:
        rows = conn.execute("SELECT DISTINCT repo_id FROM analysis_history").fetchall()
    return [r["repo_id"] for r in rows]


def make_repo_id(name: str) -> str:
    """Generate a stable repo ID from a name or path."""
    return hashlib.md5(name.encode()).hexdigest()[:12]
