"""
GitHub repository analyzer.
Clones a public repo and runs the full analysis pipeline on it.
"""
import os
import shutil
import tempfile
from typing import Dict

SUPPORTED = (".py", ".js", ".ts", ".jsx", ".tsx")

def clone_and_scan(repo_url: str) -> Dict[str, str]:
    """Clone a GitHub repo and return {filename: code} for all source files."""
    import git

    tmp_dir = tempfile.mkdtemp(prefix="ai_code_")
    try:
        git.Repo.clone_from(repo_url, tmp_dir, depth=1)
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
