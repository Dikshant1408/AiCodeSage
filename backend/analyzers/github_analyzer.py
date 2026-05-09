"""
GitHub repository analyzer.
Clones a public repo and runs the full analysis pipeline on it.
"""
import os
import shutil
import tempfile
from typing import Dict
from urllib.parse import urlparse

SUPPORTED = (".py", ".js", ".ts", ".jsx", ".tsx")

def normalize_github_url(repo_url: str) -> str:
    """Return a canonical public GitHub clone URL."""
    raw = (repo_url or "").strip()
    if not raw:
        raise ValueError("GitHub URL is required")

    if raw.startswith("git@github.com:"):
        raw = "https://github.com/" + raw.split("git@github.com:", 1)[1]
    elif not raw.startswith(("http://", "https://")):
        raw = "https://" + raw

    parsed = urlparse(raw)
    host = parsed.netloc.lower().strip()
    if host.startswith("www."):
        host = host[4:]
    if host != "github.com":
        raise ValueError("Only github.com repository links are supported")

    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) < 2:
        raise ValueError("Invalid GitHub repository URL")

    owner = parts[0]
    repo = parts[1][:-4] if parts[1].endswith(".git") else parts[1]
    if not owner or not repo:
        raise ValueError("Invalid GitHub repository URL")

    return f"https://github.com/{owner}/{repo}.git"

def clone_and_scan(repo_url: str) -> Dict[str, str]:
    """Clone a GitHub repo and return {filename: code} for all source files."""
    import git

    tmp_dir = tempfile.mkdtemp(prefix="ai_code_")
    try:
        normalized_url = normalize_github_url(repo_url)
        git.Repo.clone_from(normalized_url, tmp_dir, depth=1)
        files = {}
        for root, dirs, filenames in os.walk(tmp_dir):
            # Skip hidden dirs and common noise
            dirs[:] = [d for d in dirs if not d.startswith('.') and d not in ('node_modules', '__pycache__', 'venv', '.git', 'dist', 'build')]
            for fname in filenames:
                if fname.endswith(SUPPORTED):
                    full_path = os.path.join(root, fname)
                    rel_path = os.path.relpath(full_path, tmp_dir)
                    try:
                        with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                            content = f.read()
                        if content.strip():
                            files[rel_path] = content
                    except Exception:
                        pass
        return files
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)
