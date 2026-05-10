"""
Project Summary API — standalone endpoint
POST /api/summary/zip    — upload ZIP, get plain English project summary
POST /api/summary/github — GitHub URL, get plain English project summary
"""
import io, zipfile
from fastapi import APIRouter, UploadFile, File
from pydantic import BaseModel
from ai_engine.ollama_client import ask_ai

router = APIRouter()

SUPPORTED = (".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".css", ".scss", ".html", ".sql", ".md", ".json")
SKIP_DIRS = ("node_modules", "venv", ".venv", "dist", "build", ".git",
             "__pycache__", ".next", "coverage", "vendor", "target")
PRIORITY_FILES = ["README.md", "main.py", "app.py", "index.js", "app.js",
                  "App.jsx", "App.tsx", "package.json", "requirements.txt",
                  "index.ts", "server.ts", "server.js", "manage.py"]


def _build_summary(files: dict, repo_name: str) -> dict:
    # Detect stack
    exts = {}
    for f in files:
        ext = f.rsplit(".", 1)[-1].lower() if "." in f else ""
        if ext:
            exts[ext] = exts.get(ext, 0) + 1

    stack = []
    all_code = " ".join(list(files.values())[:8]).lower()
    if "py" in exts:
        stack.append("Python")
        if "fastapi" in all_code: stack.append("FastAPI")
        elif "flask" in all_code: stack.append("Flask")
        elif "django" in all_code: stack.append("Django")
    if any(e in exts for e in ("jsx", "tsx")): stack.append("React")
    if "ts" in exts or "tsx" in exts: stack.append("TypeScript")
    elif "js" in exts or "jsx" in exts: stack.append("JavaScript")
    if "java" in exts: stack.append("Java")
    if "next" in all_code and "js" in exts: stack.append("Next.js")

    # File tree
    file_list = "\n".join(f"  {f} ({len(v.splitlines())} lines)"
                          for f, v in list(files.items())[:30])

    # Key file contents
    key_files = []
    for p in PRIORITY_FILES:
        for fn, code in files.items():
            if fn.endswith(p) and fn not in [k[0] for k in key_files]:
                key_files.append((fn, code[:800]))
                break
    if not key_files:
        for fn, code in list(files.items())[:3]:
            key_files.append((fn, code[:500]))

    key_content = "\n\n".join(f"=== {fn} ===\n{code}" for fn, code in key_files[:3])

    prompt = f"""You are explaining the project "{repo_name}" to someone who wants to fully understand it.

Files in this project:
{file_list}

Key code:
{key_content}

Write a clear, easy-to-understand explanation using exactly these section headers on their own line:

WHAT IT IS:
Write 2-3 sentences. Explain what this project is like you're telling a friend. What kind of app is it? What real-world problem does it solve? Be specific — mention the actual purpose, not generic terms like "web application".

WHAT IT DOES:
Write 3-4 sentences. Walk through what a user actually experiences. What do they see when they open it? What can they do? What happens step by step? Make it feel real and concrete.

HOW IT WORKS:
Write 3-4 sentences. Explain the technical side in simple terms. What are the main parts? How do they connect? For example: "The frontend is built with React and sends requests to a Python backend. The backend stores data in a database and uses an AI model to generate responses." Use the actual technologies you can see in the code.

CURRENT STATE:
Write 2-3 sentences. Be honest about where this project stands. Is it a prototype, a working MVP, or production-ready? What is clearly missing — authentication, tests, error handling, deployment setup? What would need to happen before real users could rely on it?

WHAT IT COULD BECOME:
Write 3-4 sentences. Paint a picture of what this project could grow into. What features would make it genuinely useful? What would make it stand out? Think about the most impactful improvements, not just technical fixes.

Rules:
- Write in flowing paragraphs. No bullet points. No markdown symbols like ** or ##.
- Use simple, clear language. Avoid jargon. If you must use a technical term, explain it briefly.
- Be specific to THIS project. Reference actual file names, technologies, and features you can see.
- Each section should feel complete and informative on its own.
- Total length: 200-300 words."""

    try:
        ai_text = ask_ai(prompt)
        # Deduplicate repeated sections
        headers = ["WHAT IT IS", "WHAT IT DOES", "HOW IT WORKS", "WHAT IT COULD BECOME"]
        seen = set()
        clean = []
        for line in ai_text.splitlines():
            upper = line.strip().upper().lstrip("*").strip().rstrip(":")
            if upper in headers:
                if upper in seen:
                    break
                seen.add(upper)
            clean.append(line)
        ai_text = "\n".join(clean).strip()
    except Exception as e:
        ai_text = f"A {' + '.join(stack) or 'software'} project with {len(files)} files."

    return {
        "repo_name": repo_name,
        "stack": stack,
        "file_count": len(files),
        "total_lines": sum(len(v.splitlines()) for v in files.values()),
        "languages": exts,
        "summary": ai_text,
    }


# ── ZIP ───────────────────────────────────────────────────────────────────────

@router.post("/zip")
async def summary_from_zip(file: UploadFile = File(...)):
    contents = await file.read()
    try:
        zf = zipfile.ZipFile(io.BytesIO(contents))
    except zipfile.BadZipFile:
        return {"error": "Invalid ZIP file"}

    files = {}
    for name in zf.namelist():
        parts = name.replace("\\", "/").split("/")
        if any(s in parts for s in SKIP_DIRS):
            continue
        if name.endswith(SUPPORTED) and not name.endswith("/"):
            code = zf.read(name).decode("utf-8", errors="ignore").strip()
            if code and len(code) > 10:
                files[name] = code
    zf.close()

    if not files:
        return {"error": "No readable source files found in ZIP"}

    # Cap at 40 files
    files = dict(list(files.items())[:40])
    repo_name = file.filename.replace(".zip", "") or "project"
    return _build_summary(files, repo_name)


# ── GitHub ────────────────────────────────────────────────────────────────────

class GithubRequest(BaseModel):
    repo_url: str

@router.post("/github")
def summary_from_github(req: GithubRequest):
    try:
        from analyzers.github_analyzer import clone_and_scan
        files = clone_and_scan(req.repo_url)
    except Exception as e:
        return {"error": f"Failed to clone repo: {e}"}

    if not files:
        return {"error": "No source files found"}

    files = dict(list(files.items())[:40])
    repo_name = req.repo_url.rstrip("/").split("/")[-1]
    return _build_summary(files, repo_name)
