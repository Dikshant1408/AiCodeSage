"""
Parallel analysis engine — analyze multiple files concurrently.
Uses ThreadPoolExecutor (safe for I/O-bound Groq API calls).
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, Callable, Any
import traceback


def analyze_files_parallel(
    files: Dict[str, str],
    analyze_fn: Callable[[str, str], Any],
    max_workers: int = 4,
) -> Dict[str, Any]:
    """
    Run analyze_fn(filename, code) for each file in parallel.
    Returns {filename: result_or_error}.
    """
    results = {}

    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_file = {
            executor.submit(analyze_fn, filename, code): filename
            for filename, code in files.items()
        }
        for future in as_completed(future_to_file):
            filename = future_to_file[future]
            try:
                results[filename] = future.result()
            except Exception as e:
                results[filename] = {"error": str(e), "traceback": traceback.format_exc()}

    return results


def analyze_files_static_parallel(
    files: Dict[str, str],
    max_workers: int = 6,
) -> Dict[str, dict]:
    """
    Run static analysis (no AI) on all files in parallel.
    Returns {filename: engine_result_dict}.
    """
    from language_engines.detector import detect_language, get_engine

    def _analyze(filename: str, code: str) -> dict:
        lang = detect_language(filename)
        engine = get_engine(lang)
        result = engine.analyze(code, filename)
        return {
            "language": result.language,
            "functions": result.functions,
            "classes": result.classes,
            "imports": result.imports,
            "static_issues": result.static_issues,
            "metrics": result.metrics,
        }

    return analyze_files_parallel(files, _analyze, max_workers=max_workers)
