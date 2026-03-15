from fastapi import APIRouter
from pydantic import BaseModel
from analyzers.github_analyzer import clone_and_scan
from analyzers.pipeline import run_pipeline
from ai_engine.rag_chat import index_codebase
from dataclasses import asdict
import uuid

router = APIRouter()

class GithubRequest(BaseModel):
    repo_url: str

@router.post("/")
def analyze_github(req: GithubRequest):
    try:
        files = clone_and_scan(req.repo_url)
    except Exception as e:
        return {"error": f"Failed to clone repo: {e}"}

    if not files:
        return {"error": "No supported source files found in repo", "files_analyzed": 0}

    session_id = str(uuid.uuid4())[:8]
    results = {}

    for filename, code in list(files.items())[:20]:  # cap at 20 files
        try:
            result = run_pipeline(code, language=filename.rsplit(".", 1)[-1], analyze_functions=False)
            results[filename] = {
                "functions": result.functions_found,
                "classes": result.classes_found,
                "quality": asdict(result.quality),
                "ai_bugs": result.ai_bugs,
                "static": result.static.get("pylint", ""),
            }
        except Exception as e:
            results[filename] = {"error": str(e)}

    try:
        index_codebase(session_id, files)
    except Exception:
        pass

    scores = [r["quality"]["score"] for r in results.values() if r.get("quality")]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    return {
        "session_id": session_id,
        "repo_url": req.repo_url,
        "files_analyzed": len(results),
        "avg_quality_score": avg_score,
        "results": results,
    }
