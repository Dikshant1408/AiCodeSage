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

    prompt = f"""Look at this project called "{repo_name}" and explain it in plain developer language.

Files:
{file_list}

Key code:
{key_content}

Write exactly 4 short paragraphs with these labels on their own line:

WHAT IT IS:
One sentence. What type of app is this and what problem does it solve? Be specific — not "a web application" but "a portfolio site with an AI chat assistant that answers questions about the developer".

WHAT IT DOES:
2-3 sentences. What can a user actually do with it? What happens when they open it?

HOW IT WORKS:
2 sentences. How does the code actually work? What talks to what? Keep it technical but simple.

WHAT IT COULD BECOME:
2-3 sentences. What is the most obvious next step to make this genuinely useful or production-ready?

Rules:
- No bullet points. No markdown. No bold text. Just plain paragraphs.
- Sound like a developer talking to another developer.
- Be specific to THIS project. Use actual file names you can see.
- Max 150 words total."""

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
