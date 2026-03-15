import subprocess
import tempfile
import os

def run_pylint(code: str) -> str:
    """Run pylint on a code string and return the output."""
    with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
        f.write(code)
        tmp_path = f.name
    try:
        result = subprocess.run(
            ["pylint", tmp_path, "--output-format=text", "--score=yes"],
            capture_output=True, text=True, timeout=30
        )
        return result.stdout or result.stderr
    except FileNotFoundError:
        return "pylint not installed. Run: pip install pylint"
    finally:
        os.unlink(tmp_path)

def run_bandit(code: str) -> str:
    """Run bandit security scanner on a code string."""
    with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
        f.write(code)
        tmp_path = f.name
    try:
        result = subprocess.run(
            ["bandit", "-r", tmp_path, "-f", "text"],
            capture_output=True, text=True, timeout=30
        )
        return result.stdout or result.stderr
    except FileNotFoundError:
        return "bandit not installed. Run: pip install bandit"
    finally:
        os.unlink(tmp_path)

def run_flake8(code: str) -> str:
    """Run flake8 style checker on a code string."""
    with tempfile.NamedTemporaryFile(suffix=".py", mode="w", delete=False) as f:
        f.write(code)
        tmp_path = f.name
    try:
        result = subprocess.run(
            ["flake8", tmp_path],
            capture_output=True, text=True, timeout=30
        )
        return result.stdout or "No style issues found."
    except FileNotFoundError:
        return "flake8 not installed. Run: pip install flake8"
    finally:
        os.unlink(tmp_path)
