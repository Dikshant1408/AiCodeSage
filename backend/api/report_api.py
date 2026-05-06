"""
Comprehensive Intelligence Report
Runs ALL system engines in parallel and produces a structured report:
- Static analysis (pylint + bandit + flake8)
- Quality score with grade
- Taint / data-flow analysis
- Duplicate detection
- Performance analysis
- Confidence-scored security findings
- Knowledge graph stats
- AI executive summary (1 call, grounded in real data)
"""
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, List, Optional
from dataclasses import asdict

from analyzers.static_analyzer import run_pylint, run_bandit, run_flake8
from analyzers.quality_score import calculate_score
from analyzers.code_parser import parse_code
from analyzers.control_flow import analyze_control_flow
from analyzers.duplicate_detector import detect_duplicates
from analyzers.confidence_scorer import score_code, format_findings
from analyzers.knowledge_graph import build_knowledge_graph
from ai_engine.ollama_client import ask_ai

router = APIRouter()


class ReportRequest(BaseModel):
    files: Dict[str, str]          # {filename: code}
    repo_name: str = "project"
    include_ai_summary: bool = True


@router.post("/generate")
def generate_report(req: ReportRequest):
    t0 = time.time()
    files = dict(list(req.files.items())[:10])  # cap at 10 files
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")

    # ── Run all engines in parallel ───────────────────────────────────────────
    file_results = {}

    def analyze_file(filename, code):
        pylint_out = run_pylint(code)
        bandit_out = run_bandit(code)
        flake8_out = run_flake8(code)
        parsed     = parse_code(code)
        quality    = calculate_score(pylint_out, bandit_out, flake8_out,
                                     function_count=len(parsed.functions),
                                     line_count=len(code.splitlines()))
        taint      = analyze_control_flow(code)
        dupes      = detect_duplicates(code)
        confidence = format_findings(score_code(code, bandit_out))
        return {
            "filename": filename,
            "lines": len(code.splitlines()),
            "functions": [f.name for f in parsed.functions],
            "classes": [c.name for c in parsed.classes],
            "quality": asdict(quality),
            "taint_issues": [asdict(d) for d in taint.data_flow_issues],
            "infinite_loops": taint.infinite_loop_risks,
            "complexity": taint.function_complexity,
            "duplicates": len(detect_duplicates(code)),
            "confidence_findings": confidence,
            "pylint": pylint_out[:600],
            "bandit": bandit_out[:600],
        }

    with ThreadPoolExecutor(max_workers=4) as ex:
        futures = {ex.submit(analyze_file, fn, code): fn for fn, code in files.items()}
        for future in as_completed(futures):
            fn = futures[future]
            try:
                file_results[fn] = future.result()
            except Exception as e:
                file_results[fn] = {"filename": fn, "error": str(e)}

    # ── Knowledge graph (cross-file) ──────────────────────────────────────────
    try:
        kg = build_knowledge_graph(files)
        graph_stats = {
            "nodes": len(kg.nodes),
            "edges": len(kg.edges),
            "files": len([n for n in kg.nodes if n.type == "file"]),
            "functions": len([n for n in kg.nodes if n.type == "function"]),
            "classes": len([n for n in kg.nodes if n.type == "class"]),
        }
    except Exception:
        graph_stats = {"nodes": 0, "edges": 0, "files": 0, "functions": 0, "classes": 0}

    # ── Aggregate metrics ─────────────────────────────────────────────────────
    valid = [r for r in file_results.values() if "quality" in r]
    total_lines     = sum(r.get("lines", 0) for r in valid)
    total_functions = sum(len(r.get("functions", [])) for r in valid)
    total_classes   = sum(len(r.get("classes", [])) for r in valid)
    total_bugs      = sum(r["quality"]["bugs"] for r in valid)
    total_security  = sum(r["quality"]["security_issues"] for r in valid)
    total_smells    = sum(r["quality"]["code_smells"] for r in valid)
    total_taint     = sum(len(r.get("taint_issues", [])) for r in valid)
    total_dupes     = sum(r.get("duplicates", 0) for r in valid)
    avg_score       = round(sum(r["quality"]["score"] for r in valid) / max(len(valid), 1), 2)
    avg_grade       = _score_to_grade(avg_score)

    all_confidence  = []
    for r in valid:
        all_confidence.extend(r.get("confidence_findings", []))
    high_conf_sec   = [f for f in all_confidence if f.get("confidence_label") == "high"]

    # Worst files by score
    worst_files = sorted(valid, key=lambda r: r["quality"]["score"])[:3]

    # All taint paths across files
    all_taint = []
    for r in valid:
        for t in r.get("taint_issues", []):
            all_taint.append({**t, "file": r["filename"]})

    # ── AI executive summary (grounded in real data) ──────────────────────────
    ai_summary = ""
    if req.include_ai_summary:
        prompt = f"""You are a senior software engineer writing an executive code quality report.

Project: {req.repo_name}
Files analyzed: {len(valid)}
Total lines: {total_lines}
Average quality score: {avg_score}/10 (Grade: {avg_grade})
Total bugs: {total_bugs}
Security issues: {total_security}
Taint/injection paths: {total_taint}
Duplicate code groups: {total_dupes}
Code smells: {total_smells}

Worst files:
{chr(10).join(f"- {r['filename']}: {r['quality']['score']}/10 — {'; '.join(r['quality']['issues'][:2])}" for r in worst_files)}

High-confidence security findings:
{chr(10).join(f"- {f['issue']} ({f['confidence_label']} confidence)" for f in high_conf_sec[:5]) or "None"}

Write a 4-sentence executive summary: overall health, top risk, most critical file, and one concrete action item.
Be specific. Use the actual numbers above."""
        try:
            ai_summary = ask_ai(prompt)
        except Exception as e:
            ai_summary = f"AI summary unavailable: {e}"

    duration = round(time.time() - t0, 1)

    return {
        "repo_name": req.repo_name,
        "generated_at": now,
        "duration_sec": duration,
        "summary": {
            "files_analyzed": len(valid),
            "total_lines": total_lines,
            "total_functions": total_functions,
            "total_classes": total_classes,
            "avg_score": avg_score,
            "avg_grade": avg_grade,
            "total_bugs": total_bugs,
            "total_security": total_security,
            "total_smells": total_smells,
            "taint_paths": total_taint,
            "duplicate_groups": total_dupes,
        },
        "graph": graph_stats,
        "file_results": list(file_results.values()),
        "all_taint_paths": all_taint,
        "high_confidence_security": high_conf_sec,
        "worst_files": [{"filename": r["filename"], "score": r["quality"]["score"], "grade": r["quality"]["grade"], "issues": r["quality"]["issues"][:4]} for r in worst_files],
        "ai_summary": ai_summary,
    }


def _score_to_grade(score: float) -> str:
    if score >= 9: return "A+"
    if score >= 8: return "A"
    if score >= 7: return "B"
    if score >= 6: return "C"
    if score >= 5: return "D"
    return "F"
