"""
Advanced analysis endpoints:
- Control flow analysis / taint analysis
- Duplicate detection
- AI auto-fix
- Architecture summarizer
- Technical debt explanation
- Complexity refactor suggestions
- AI debugger
- Semantic code search
- Autonomous Bug-Fix Agent
- Code Knowledge Graph
"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, Dict, List
from dataclasses import asdict

from analyzers.control_flow import analyze_control_flow
from analyzers.duplicate_detector import detect_duplicates
from analyzers.bug_fix_agent import run_bug_fix_agent
from analyzers.knowledge_graph import build_knowledge_graph
from ai_engine.groq_client import ask_ai
from ai_engine.prompts import (
    autofix_prompt, architecture_prompt, technical_debt_prompt,
    complexity_refactor_prompt, debug_prompt, semantic_search_prompt,
    knowledge_graph_summary_prompt,
)
from analyzers.code_parser import parse_code
from analyzers.quality_score import calculate_score
from analyzers.static_analyzer import run_pylint, run_bandit, run_flake8

router = APIRouter()

class CodeRequest(BaseModel):
    code: str
    language: str = "python"

class AutoFixRequest(BaseModel):
    code: str
    issue: str

class ArchitectureRequest(BaseModel):
    files: Dict[str, str]  # {filename: code}

class DebtRequest(BaseModel):
    code: str

class ComplexityRequest(BaseModel):
    code: str
    function_name: Optional[str] = None

class DebugRequest(BaseModel):
    error: str
    code: str = ""

class SearchRequest(BaseModel):
    query: str
    files: Dict[str, str]

# ── Control Flow ──────────────────────────────────────────────────────────────
@router.post("/control-flow")
def control_flow(req: CodeRequest):
    result = analyze_control_flow(req.code)
    return {
        "branch_paths": [asdict(b) for b in result.branch_paths[:20]],
        "infinite_loop_risks": result.infinite_loop_risks,
        "data_flow_issues": [asdict(d) for d in result.data_flow_issues],
        "function_complexity": result.function_complexity,
    }

# ── Duplicate Detection ───────────────────────────────────────────────────────
@router.post("/duplicates")
def find_duplicates(req: CodeRequest):
    groups = detect_duplicates(req.code, threshold=0.72)
    return {
        "duplicate_groups": [asdict(g) for g in groups],
        "total_duplicates": len(groups),
    }

# ── AI Auto-Fix ───────────────────────────────────────────────────────────────
@router.post("/autofix")
def auto_fix(req: AutoFixRequest):
    fix = ask_ai(autofix_prompt(req.code, req.issue))
    return {"fix": fix, "original_issue": req.issue}

# ── Architecture Summarizer ───────────────────────────────────────────────────
@router.post("/architecture")
def summarize_architecture(req: ArchitectureRequest):
    # Build a compact summary of each file for the prompt
    summaries = []
    for filename, code in list(req.files.items())[:15]:
        parsed = parse_code(code, filename.rsplit(".", 1)[-1])
        fns = ", ".join(f.name for f in parsed.functions[:8])
        cls = ", ".join(c.name for c in parsed.classes[:5])
        imps = "; ".join(parsed.imports[:5])
        lines = len(code.splitlines())
        summaries.append(
            f"File: {filename} ({lines} lines)\n"
            f"  Functions: {fns or 'none'}\n"
            f"  Classes: {cls or 'none'}\n"
            f"  Imports: {imps or 'none'}"
        )
    files_summary = "\n\n".join(summaries)
    summary = ask_ai(architecture_prompt(files_summary))
    return {"architecture_summary": summary, "files_analyzed": len(req.files)}

# ── Technical Debt ────────────────────────────────────────────────────────────
@router.post("/technical-debt")
def technical_debt(req: DebtRequest):
    pylint_out = run_pylint(req.code)
    bandit_out = run_bandit(req.code)
    flake8_out = run_flake8(req.code)
    parsed = parse_code(req.code)
    quality = calculate_score(pylint_out, bandit_out, flake8_out, function_count=len(parsed.functions), line_count=len(req.code.splitlines()))
    quality_summary = (
        f"Score: {quality.score}/10 | Grade: {quality.grade}\n"
        f"Bugs: {quality.bugs} | Security: {quality.security_issues} | Smells: {quality.code_smells}\n"
        f"Complexity: {quality.complexity}\n"
        f"Issues: {'; '.join(quality.issues)}"
    )
    debt_report = ask_ai(technical_debt_prompt(req.code, quality_summary))
    return {
        "debt_report": debt_report,
        "quality": asdict(quality),
    }

# ── Complexity Refactor ───────────────────────────────────────────────────────
@router.post("/complexity-refactor")
def complexity_refactor(req: ComplexityRequest):
    parsed = parse_code(req.code)
    results = []
    # Find long/complex functions
    targets = parsed.functions
    if req.function_name:
        targets = [f for f in targets if f.name == req.function_name]
    for fn in targets[:5]:
        line_count = len(fn.body.splitlines())
        if line_count >= 15 or req.function_name:
            suggestion = ask_ai(complexity_refactor_prompt(fn.name, fn.body, line_count))
            results.append({
                "function": fn.name,
                "line_count": line_count,
                "start_line": fn.start_line,
                "suggestion": suggestion,
            })
    return {"refactor_suggestions": results}

# ── AI Debugger ───────────────────────────────────────────────────────────────
@router.post("/debug")
def debug_error(req: DebugRequest):
    explanation = ask_ai(debug_prompt(req.error, req.code))
    return {"explanation": explanation}

# ── Semantic Search ───────────────────────────────────────────────────────────
@router.post("/semantic-search")
def semantic_search(req: SearchRequest):
    # Build context from files
    context_parts = []
    for filename, code in list(req.files.items())[:10]:
        lines = code.splitlines()
        context_parts.append(f"=== {filename} ===\n" + "\n".join(
            f"{i+1}: {line}" for i, line in enumerate(lines)
        ))
    context = "\n\n".join(context_parts)[:8000]  # cap context size
    result = ask_ai(semantic_search_prompt(req.query, context))
    return {"results": result, "query": req.query}


# ── Autonomous Bug-Fix Agent ──────────────────────────────────────────────────
class BugFixAgentRequest(BaseModel):
    files: Dict[str, str]           # {filename: code}
    severity_filter: str = "all"    # "all" | "high" | "high+medium"
    max_fixes_per_file: int = 3

@router.post("/bug-fix-agent")
def bug_fix_agent(req: BugFixAgentRequest):
    report = run_bug_fix_agent(
        files=req.files,
        max_fixes_per_file=req.max_fixes_per_file,
        severity_filter=req.severity_filter,
    )
    return {
        "files_scanned": report.files_scanned,
        "issues_found": report.issues_found,
        "patches_generated": report.patches_generated,
        "skipped": report.skipped,
        "patches": [
            {
                "file": p.issue.file,
                "line": p.issue.line,
                "severity": p.issue.severity,
                "category": p.issue.category,
                "description": p.issue.description,
                "code_snippet": p.issue.code_snippet,
                "patch": p.patch,
                "explanation": p.explanation,
                "confidence": p.confidence,
            }
            for p in report.patches
        ],
    }


# ── Code Knowledge Graph ──────────────────────────────────────────────────────
class GraphRequest(BaseModel):
    files: Dict[str, str]
    include_modules: bool = False   # whether to include external module nodes

@router.post("/knowledge-graph")
def knowledge_graph(req: GraphRequest):
    graph = build_knowledge_graph(req.files)

    nodes = [asdict(n) for n in graph.nodes]
    edges = [asdict(e) for e in graph.edges]

    # Optionally strip external module nodes to reduce noise
    if not req.include_modules:
        module_ids = {n["id"] for n in nodes if n["type"] == "module"}
        nodes = [n for n in nodes if n["type"] != "module"]
        edges = [e for e in edges if e["source"] not in module_ids and e["target"] not in module_ids]

    # AI summary
    summary = ask_ai(knowledge_graph_summary_prompt(graph.stats))

    return {
        "nodes": nodes,
        "edges": edges,
        "stats": graph.stats,
        "summary": summary,
    }
