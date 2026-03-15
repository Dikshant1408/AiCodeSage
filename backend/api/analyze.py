from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from analyzers.pipeline import run_pipeline
from analyzers.code_parser import parse_code
from ai_engine.rag_chat import index_codebase, query_codebase
from ai_engine.groq_client import ask_ai
from ai_engine.prompts import bug_detection_prompt
from analyzers.static_analyzer import run_pylint, run_bandit
from dataclasses import asdict
import zipfile, io, uuid

router = APIRouter()
SUPPORTED_EXTENSIONS = (".py", ".js", ".ts", ".jsx", ".tsx")

class CodeRequest(BaseModel):
    code: str

class ChatRequest(BaseModel):
    session_id: str
    question: str

@router.post("/bugs")
def detect_bugs(req: CodeRequest):
    parsed = parse_code(req.code)
    ai_bugs = ask_ai(bug_detection_prompt(req.code))
    static = run_pylint(req.code)
    return {
        "ai_bugs": ai_bugs,
        "static_issues": static,
        "functions_found": [f.name for f in parsed.functions],
    }

@router.post("/upload")
async def upload_project(file: UploadFile = File(...)):
    contents = await file.read()
    session_id = str(uuid.uuid4())[:8]
    all_files = {}
    results = {}

    try:
        zf = zipfile.ZipFile(io.BytesIO(contents))
    except zipfile.BadZipFile:
        return {"error": "Invalid ZIP file", "files_analyzed": 0, "results": {}}

    source_files = [
        n for n in zf.namelist()
        if n.endswith(SUPPORTED_EXTENSIONS) and "__MACOSX" not in n
    ]

    for name in source_files:
        code = zf.read(name).decode("utf-8", errors="ignore")
        if not code.strip():
            continue
        all_files[name] = code
        file_result = {"error": None, "functions": [], "quality": None, "ai_bugs": "", "static": "", "security": ""}
        try:
            result = run_pipeline(code, language=name.rsplit(".", 1)[-1], analyze_functions=False)
            file_result["functions"] = result.functions_found
            file_result["classes"] = result.classes_found
            file_result["quality"] = asdict(result.quality)
            file_result["ai_bugs"] = result.ai_bugs
            file_result["static"] = result.static.get("pylint", "")
            file_result["security"] = result.static.get("bandit", "")
        except Exception as e:
            file_result["error"] = str(e)
        results[name] = file_result

    zf.close()

    # Index for RAG chat
    if all_files:
        try:
            index_codebase(session_id, all_files)
        except Exception:
            pass

    # Aggregate quality score
    scores = [r["quality"]["score"] for r in results.values() if r.get("quality")]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    return {
        "session_id": session_id,
        "files_analyzed": len(results),
        "avg_quality_score": avg_score,
        "results": results,
    }

@router.post("/chat")
def chat_with_code(req: ChatRequest):
    answer = query_codebase(req.session_id, req.question)
    return {"answer": answer}
