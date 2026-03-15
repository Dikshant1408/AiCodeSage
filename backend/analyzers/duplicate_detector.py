"""
Duplicate Code Detector.
Uses token-based hashing to find similar/duplicate functions across files or within a file.
"""
import ast
import hashlib
import re
from dataclasses import dataclass, field
from typing import List, Dict, Tuple

@dataclass
class DuplicateGroup:
    similarity: float
    locations: List[Dict]  # [{file, function, start_line, end_line}]
    snippet: str

def _normalize_tokens(code: str) -> str:
    """Normalize code: strip comments, normalize whitespace, replace literals."""
    code = re.sub(r'#.*', '', code)
    code = re.sub(r'""".*?"""', '""', code, flags=re.DOTALL)
    code = re.sub(r"'''.*?'''", "''", code, flags=re.DOTALL)
    code = re.sub(r'"[^"]*"', '"STR"', code)
    code = re.sub(r"'[^']*'", "'STR'", code)
    code = re.sub(r'\b\d+\b', 'NUM', code)
    code = re.sub(r'\s+', ' ', code).strip()
    return code

def _hash_block(code: str) -> str:
    normalized = _normalize_tokens(code)
    return hashlib.md5(normalized.encode()).hexdigest()

def _extract_functions(code: str, filename: str = "file") -> List[Dict]:
    """Extract all functions with their bodies."""
    functions = []
    try:
        tree = ast.parse(code)
        lines = code.splitlines()
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                start = node.lineno - 1
                end = node.end_lineno if hasattr(node, 'end_lineno') else start + 10
                body = "\n".join(lines[start:end])
                functions.append({
                    "file": filename,
                    "function": node.name,
                    "start_line": node.lineno,
                    "end_line": end,
                    "body": body,
                    "hash": _hash_block(body),
                    "normalized": _normalize_tokens(body),
                })
    except SyntaxError:
        pass
    return functions

def _similarity(a: str, b: str) -> float:
    """Token-level Jaccard similarity between two normalized code strings."""
    tokens_a = set(a.split())
    tokens_b = set(b.split())
    if not tokens_a or not tokens_b:
        return 0.0
    intersection = tokens_a & tokens_b
    union = tokens_a | tokens_b
    return len(intersection) / len(union)

def detect_duplicates(
    code: str,
    filename: str = "file.py",
    other_files: Dict[str, str] = None,
    threshold: float = 0.75,
) -> List[DuplicateGroup]:
    """
    Detect duplicate/similar functions.
    - code: primary file content
    - other_files: {filename: code} for cross-file detection
    - threshold: similarity threshold (0.75 = 75% similar)
    """
    all_functions = _extract_functions(code, filename)
    if other_files:
        for fname, fcontent in other_files.items():
            all_functions.extend(_extract_functions(fcontent, fname))

    groups: List[DuplicateGroup] = []
    used = set()

    for i, fn_a in enumerate(all_functions):
        if i in used:
            continue
        group_members = [fn_a]
        for j, fn_b in enumerate(all_functions):
            if i == j or j in used:
                continue
            # Exact hash match
            if fn_a["hash"] == fn_b["hash"]:
                sim = 1.0
            else:
                sim = _similarity(fn_a["normalized"], fn_b["normalized"])
            if sim >= threshold:
                group_members.append(fn_b)
                used.add(j)

        if len(group_members) > 1:
            used.add(i)
            avg_sim = sum(
                _similarity(group_members[0]["normalized"], m["normalized"])
                for m in group_members[1:]
            ) / (len(group_members) - 1)
            groups.append(DuplicateGroup(
                similarity=round(avg_sim * 100, 1),
                locations=[{
                    "file": m["file"],
                    "function": m["function"],
                    "start_line": m["start_line"],
                    "end_line": m["end_line"],
                } for m in group_members],
                snippet=group_members[0]["body"][:300],
            ))

    return groups
