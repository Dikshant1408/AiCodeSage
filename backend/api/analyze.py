from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from analyzers.pipeline import run_pipeline
from analyzers.code_parser import parse_code
from ai_engine.rag_chat import index_codebase, query_codebase
from ai_engine.ollama_client import ask_ai
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
    ][:20]  # hard cap — never analyze more than 20 files

    for name in source_files:
        code = zf.read(name).decode("utf-8", errors="ignore")
        if not code.strip():
            continue
        all_files[name] = code

    zf.close()

    # ── Static-only analysis (NO AI calls) — runs in parallel ──────────────
    from concurrent.futures import ThreadPoolExecutor, as_completed

    def analyze_file(name, code):
        result = {"error": None, "functions": [], "quality": None, "ai_bugs": "", "static": "", "security": ""}
        try:
            parsed = parse_code(code, name.rsplit(".", 1)[-1])
            pylint_out = run_pylint(code) if name.endswith(".py") else ""
            bandit_out = run_bandit(code) if name.endswith(".py") else ""
            from analyzers.quality_score import calculate_score
            q = calculate_score(pylint_out, bandit_out, "",
                                function_count=len(parsed.functions),
                                line_count=len(code.splitlines()))
            result["functions"] = [f.name for f in parsed.functions]
            result["classes"]   = [c.name for c in parsed.classes]
            result["quality"]   = asdict(q)
            result["static"]    = pylint_out[:500]
            result["security"]  = bandit_out[:500]
        except Exception as e:
            result["error"] = str(e)
        return name, result

    with ThreadPoolExecutor(max_workers=6) as ex:
        futures = {ex.submit(analyze_file, n, c): n for n, c in all_files.items()}
        for fut in as_completed(futures):
            name, res = fut.result()
            results[name] = res

    # Index for RAG chat (background, non-blocking)
    if all_files:
        try:
            index_codebase(session_id, all_files)
        except Exception:
            pass

    scores = [r["quality"]["score"] for r in results.values() if r.get("quality")]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    return {
        "session_id": session_id,
        "files_analyzed": len(results),
        "avg_quality_score": avg_score,
        "results": results,
        "note": "Static analysis only (instant). Use Pipeline page for AI-powered fixes.",
    }

@router.post("/chat")
def chat_with_code(req: ChatRequest):
    answer = query_codebase(req.session_id, req.question)
    return {"answer": answer}
