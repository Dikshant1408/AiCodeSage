"""
Historical analytics endpoints.
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from analyzers.analytics_db import (
    save_analysis, get_history, get_all_repos, make_repo_id, HistoryEntry
)
from dataclasses import asdict

router = APIRouter()


class SaveAnalysisRequest(BaseModel):
    repo_name: str
    quality_score: float
    bug_count: int
    security_count: int
    code_smells: int
    grade: str
    files_analyzed: int = 0
    line_count: int = 0
    commit_hash: str = ""
    complexity: str = ""


@router.post("/save")
def save_analysis_endpoint(req: SaveAnalysisRequest):
    repo_id = make_repo_id(req.repo_name)
    save_analysis(
        repo_id=repo_id,
        quality_score=req.quality_score,
        bug_count=req.bug_count,
        security_count=req.security_count,
        code_smells=req.code_smells,
        grade=req.grade,
        files_analyzed=req.files_analyzed,
        line_count=req.line_count,
        commit_hash=req.commit_hash,
        complexity=req.complexity,
    )
    return {"saved": True, "repo_id": repo_id}


@router.get("/history/{repo_name}")
def get_history_endpoint(repo_name: str, limit: int = 30):
    repo_id = make_repo_id(repo_name)
    history = get_history(repo_id, limit)
    return {
        "repo_name": repo_name,
        "repo_id": repo_id,
        "history": [asdict(h) for h in history],
    }


@router.get("/repos")
def list_repos():
    return {"repos": get_all_repos()}
