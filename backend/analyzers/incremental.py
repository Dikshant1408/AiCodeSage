"""
Incremental repository analysis — only analyze changed files.
Uses git diff to detect changes, then runs the pipeline on those files only.
"""
import subprocess, os, hashlib
from typing import Dict, List, Tuple


def get_changed_files(repo_path: str, base_ref: str = "HEAD~1") -> List[str]:
    """Return list of changed file paths relative to repo root."""
    try:
        result = subprocess.run(
            ["git", "diff", "--name-only", base_ref, "HEAD"],
            cwd=repo_path, capture_output=True, text=True, timeout=15
        )
        if result.returncode == 0:
            return [f.strip() for f in result.stdout.splitlines() if f.strip()]
    except Exception:
        pass
    # Fallback: return all files
    return []


def get_staged_files(repo_path: str) -> List[str]:
    """Return list of staged (index) changed files."""
    try:
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only"],
            cwd=repo_path, capture_output=True, text=True, timeout=15
        )
        if result.returncode == 0:
            return [f.strip() for f in result.stdout.splitlines() if f.strip()]
    except Exception:
        pass
    return []


def get_file_diff(repo_path: str, filepath: str) -> str:
    """Get the unified diff for a specific file."""
    try:
        result = subprocess.run(
            ["git", "diff", "HEAD~1", "HEAD", "--", filepath],
            cwd=repo_path, capture_output=True, text=True, timeout=15
        )
        return result.stdout if result.returncode == 0 else ""
    except Exception:
        return ""


def filter_changed_files(
    all_files: Dict[str, str],
    cache: Dict[str, str],
) -> Tuple[Dict[str, str], Dict[str, str]]:
    """
    Compare file hashes against cache to find changed files.
    Returns (changed_files, updated_cache).
    """
    changed = {}
    new_cache = {}
    for filename, code in all_files.items():
        h = hashlib.md5(code.encode()).hexdigest()
        new_cache[filename] = h
        if cache.get(filename) != h:
            changed[filename] = code
    return changed, new_cache


def get_current_commit(repo_path: str) -> str:
    """Get current HEAD commit hash."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=repo_path, capture_output=True, text=True, timeout=10
        )
        return result.stdout.strip()[:12] if result.returncode == 0 else ""
    except Exception:
        return ""
