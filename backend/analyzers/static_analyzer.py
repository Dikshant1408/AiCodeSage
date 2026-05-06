"""
Static analyzer — runs pylint, bandit, flake8 in parallel threads.
Each tool writes its own temp file and runs with a tight timeout.
"""
import subprocess, tempfile, os
from concurrent.futures import ThreadPoolExecutor, as_completed

_TIMEOUT = 10  # seconds per tool (was 30)


def _run_tool(args: list, code: str, suffix: str = ".py") -> str:
    with tempfile.NamedTemporaryFile(suffix=suffix, mode="w", delete=False, encoding="utf-8") as f:
        f.write(code)
        tmp = f.name
    try:
        r = subprocess.run(args + [tmp], capture_output=True, text=True, timeout=_TIMEOUT)
        return (r.stdout or r.stderr or "").strip()
    except subprocess.TimeoutExpired:
        return f"[{args[0]} timed out after {_TIMEOUT}s]"
    except FileNotFoundError:
        return f"[{args[0]} not installed]"
    except Exception as e:
        return f"[{args[0]} error: {e}]"
    finally:
        try:
            os.unlink(tmp)
        except Exception:
            pass


def run_pylint(code: str) -> str:
    return _run_tool(["pylint", "--output-format=text", "--score=no",
                      "--disable=C0114,C0115,C0116,R0903"], code)


def run_bandit(code: str) -> str:
    return _run_tool(["bandit", "-r", "-f", "text", "-ll"], code)


def run_flake8(code: str) -> str:
    return _run_tool(["flake8", "--max-line-length=120", "--select=E,W"], code)


def run_all_parallel(code: str) -> dict:
    """Run pylint + bandit + flake8 simultaneously. ~3x faster than sequential."""
    results = {"pylint": "", "bandit": "", "flake8": ""}
    tasks = {
        "pylint":  (["pylint", "--output-format=text", "--score=no", "--disable=C0114,C0115,C0116,R0903"], code),
        "bandit":  (["bandit", "-r", "-f", "text", "-ll"], code),
        "flake8":  (["flake8", "--max-line-length=120", "--select=E,W"], code),
    }
    with ThreadPoolExecutor(max_workers=3) as ex:
        futures = {ex.submit(_run_tool, args, c): name for name, (args, c) in tasks.items()}
        for fut in as_completed(futures):
            results[futures[fut]] = fut.result()
    return results
