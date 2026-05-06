"""
Repository-Level Intelligence Engine
=====================================
Supports: Python, JavaScript, TypeScript, JSX, TSX, Java, CSS, HTML, SQL
"""
import ast, re, hashlib
from dataclasses import dataclass, field
from typing import Dict, List, Tuple, Set
from concurrent.futures import ThreadPoolExecutor, as_completed

from analyzers.static_analyzer import run_all_parallel
from analyzers.quality_score import calculate_score
from analyzers.cross_file_taint import analyze_cross_file_taint
from analyzers.deep_issue_extractor import extract_issues, DetailedIssue
from analyzers.improvement_advisor import generate_improvements, Improvement


# ── Data models ───────────────────────────────────────────────────────────────

@dataclass
class FunctionComplexity:
    file: str
    function: str
    complexity: int
    line: int
    lines_of_code: int

@dataclass
class DuplicateCluster:
    similarity: float
    functions: List[Dict]   # [{file, function, line}]
    snippet: str

@dataclass
class FileCoupling:
    file: str
    imported_by: int        # how many other files import this
    imports_count: int      # how many modules this file imports
    coupling_score: float   # higher = more risky to change

@dataclass
class DeadFunction:
    file: str
    function: str
    line: int
    reason: str

@dataclass
class ArchLayer:
    layer: str              # "controller" | "model" | "service" | "util" | "test" | "config" | "unknown"
    files: List[str]

@dataclass
class RepoIntelligenceReport:
    # Summary
    total_files: int = 0
    total_functions: int = 0
    total_lines: int = 0
    avg_quality_score: float = 0.0
    avg_grade: str = "C"

    # Per-file quality
    file_scores: List[Dict] = field(default_factory=list)

    # Complexity hotspots (worst functions first)
    complexity_hotspots: List[Dict] = field(default_factory=list)

    # Cross-file duplicates
    duplicate_clusters: List[Dict] = field(default_factory=list)

    # Dependency coupling
    coupling_map: List[Dict] = field(default_factory=list)

    # Dead code
    dead_functions: List[Dict] = field(default_factory=list)

    # Architecture layers
    architecture_layers: List[Dict] = field(default_factory=list)

    # Cross-file taint paths
    cross_file_taint: List[Dict] = field(default_factory=list)
    taint_summary: Dict = field(default_factory=dict)

    # Hotspot summary
    riskiest_files: List[str] = field(default_factory=list)
    lang_breakdown: Dict = field(default_factory=dict)

    # Deep issue list — every error/warning with file + line + fix hint
    detailed_issues: List[Dict] = field(default_factory=list)

    # Prioritized improvement recommendations
    improvements: List[Dict] = field(default_factory=list)


# ── Complexity analysis ───────────────────────────────────────────────────────

def _analyze_complexity(filename: str, code: str) -> List[FunctionComplexity]:
    results = []
    # Python — AST-based
    if filename.endswith(".py"):
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    continue
                complexity = 1
                for child in ast.walk(node):
                    if isinstance(child, (ast.If, ast.While, ast.For, ast.ExceptHandler,
                                           ast.With, ast.Assert, ast.comprehension,
                                           ast.BoolOp, ast.IfExp)):
                        complexity += 1
                end = getattr(node, "end_lineno", node.lineno + 10)
                loc = end - node.lineno + 1
                results.append(FunctionComplexity(
                    file=filename, function=node.name,
                    complexity=complexity, line=node.lineno, lines_of_code=loc,
                ))
        except SyntaxError:
            pass
    # JS/TS — regex-based
    elif filename.endswith((".js", ".jsx", ".ts", ".tsx")):
        lines = code.splitlines()
        # Match: function Foo, export function Foo, const Foo = (, export const Foo = (
        fn_pattern = re.compile(
            r'(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)'
            r'|(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\('
        )
        for i, line in enumerate(lines, 1):
            m = fn_pattern.search(line)
            if m:
                name = m.group(1) or m.group(2)
                if not name or name in ("if", "for", "while", "switch"):
                    continue
                block = "\n".join(lines[i-1:i+30])
                complexity = (1 + block.count(" if ") + block.count(" else ")
                              + block.count(" for ") + block.count(" while ")
                              + block.count(" && ") + block.count(" || ")
                              + block.count("?.") + block.count(" ? "))
                results.append(FunctionComplexity(
                    file=filename, function=name,
                    complexity=complexity, line=i, lines_of_code=min(30, len(lines)-i+1),
                ))
    return results


# ── Duplicate detection across files ─────────────────────────────────────────

def _normalize(code: str) -> str:
    code = re.sub(r'#.*', '', code)
    code = re.sub(r'""".*?"""', '""', code, flags=re.DOTALL)
    code = re.sub(r"'''.*?'''", "''", code, flags=re.DOTALL)
    code = re.sub(r'"[^"]*"', '"S"', code)
    code = re.sub(r"'[^']*'", "'S'", code)
    code = re.sub(r'\b\d+\b', 'N', code)
    return re.sub(r'\s+', ' ', code).strip()

def _jaccard(a: str, b: str) -> float:
    ta, tb = set(a.split()), set(b.split())
    if not ta or not tb:
        return 0.0
    return len(ta & tb) / len(ta | tb)

def _extract_all_functions(files: Dict[str, str]) -> List[Dict]:
    funcs = []
    for filename, code in files.items():
        # Python — AST
        if filename.endswith(".py"):
            try:
                tree = ast.parse(code)
                src_lines = code.splitlines()
                for node in ast.walk(tree):
                    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        end = getattr(node, "end_lineno", node.lineno + 10)
                        body = "\n".join(src_lines[node.lineno - 1:end])
                        if len(body.split()) < 5:
                            continue
                        funcs.append({
                            "file": filename, "function": node.name,
                            "line": node.lineno, "body": body,
                            "normalized": _normalize(body),
                            "hash": hashlib.md5(_normalize(body).encode()).hexdigest(),
                        })
            except SyntaxError:
                pass
        # JS/TS — regex
        elif filename.endswith((".js", ".jsx", ".ts", ".tsx")):
            fn_pattern = re.compile(
                r'(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)'
                r'|(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\('
            )
            lines = code.splitlines()
            for i, line in enumerate(lines):
                m = fn_pattern.search(line)
                if m:
                    name = m.group(1) or m.group(2)
                    if not name or name in ("if", "for", "while"):
                        continue
                    body = "\n".join(lines[i:i+20])
                    if len(body.split()) < 5:
                        continue
                    funcs.append({
                        "file": filename, "function": name,
                        "line": i + 1, "body": body,
                        "normalized": _normalize(body),
                        "hash": hashlib.md5(_normalize(body).encode()).hexdigest(),
                    })
    return funcs

def _find_cross_file_duplicates(files: Dict[str, str], threshold: float = 0.75) -> List[DuplicateCluster]:
    funcs = _extract_all_functions(files)
    clusters = []
    used = set()

    for i, f1 in enumerate(funcs):
        if i in used:
            continue
        group = [f1]
        for j, f2 in enumerate(funcs):
            if j <= i or j in used:
                continue
            # Exact hash match
            if f1["hash"] == f2["hash"]:
                group.append(f2)
                used.add(j)
                continue
            # Similarity check (only if different files — same-file handled elsewhere)
            if f1["file"] != f2["file"]:
                sim = _jaccard(f1["normalized"], f2["normalized"])
                if sim >= threshold:
                    group.append(f2)
                    used.add(j)

        if len(group) > 1:
            used.add(i)
            sim = 1.0 if all(g["hash"] == group[0]["hash"] for g in group) else threshold
            clusters.append(DuplicateCluster(
                similarity=round(sim, 2),
                functions=[{"file": g["file"], "function": g["function"], "line": g["line"]} for g in group],
                snippet=group[0]["body"][:200],
            ))
    return clusters


# ── Dependency coupling ───────────────────────────────────────────────────────

def _build_coupling_map(files: Dict[str, str]) -> List[FileCoupling]:
    file_modules: Dict[str, str] = {}
    for filename in files:
        base = filename.replace("/", ".").replace("\\", ".")
        for ext in (".py", ".js", ".ts", ".jsx", ".tsx"):
            if base.endswith(ext):
                base = base[:-len(ext)]
        parts = base.split(".")
        file_modules[parts[-1]] = filename

    import_counts: Dict[str, int] = {f: 0 for f in files}
    imports_out: Dict[str, int] = {f: 0 for f in files}

    for filename, code in files.items():
        if filename.endswith(".py"):
            try:
                tree = ast.parse(code)
                for node in ast.walk(tree):
                    if isinstance(node, ast.Import):
                        for alias in node.names:
                            imports_out[filename] = imports_out.get(filename, 0) + 1
                            mod = alias.name.split(".")[-1]
                            if mod in file_modules:
                                import_counts[file_modules[mod]] = import_counts.get(file_modules[mod], 0) + 1
                    elif isinstance(node, ast.ImportFrom) and node.module:
                        imports_out[filename] = imports_out.get(filename, 0) + 1
                        mod = node.module.split(".")[-1]
                        if mod in file_modules:
                            import_counts[file_modules[mod]] = import_counts.get(file_modules[mod], 0) + 1
            except SyntaxError:
                pass
        elif filename.endswith((".js", ".jsx", ".ts", ".tsx")):
            for m in re.finditer(r"(?:import|require)\s*.*?['\"]([./][^'\"]+)['\"]", code):
                imports_out[filename] = imports_out.get(filename, 0) + 1
                mod = m.group(1).split("/")[-1].split(".")[0]
                if mod in file_modules:
                    import_counts[file_modules[mod]] = import_counts.get(file_modules[mod], 0) + 1

    result = []
    max_imported = max(import_counts.values(), default=1) or 1
    for filename in files:
        imported_by = import_counts.get(filename, 0)
        imp_out = imports_out.get(filename, 0)
        coupling = round((imported_by / max_imported) * 0.7 + min(imp_out / 10, 1) * 0.3, 2)
        result.append(FileCoupling(
            file=filename, imported_by=imported_by,
            imports_count=imp_out, coupling_score=coupling,
        ))
    return sorted(result, key=lambda x: x.coupling_score, reverse=True)


# ── Dead code detection ───────────────────────────────────────────────────────

def _find_dead_code(files: Dict[str, str]) -> List[DeadFunction]:
    defined: Dict[str, Tuple[str, int]] = {}
    called: Set[str] = set()

    for filename, code in files.items():
        # Python
        if filename.endswith(".py"):
            try:
                tree = ast.parse(code)
                for node in ast.walk(tree):
                    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        if not node.name.startswith("_"):
                            defined[node.name] = (filename, node.lineno)
                    elif isinstance(node, ast.Call):
                        if isinstance(node.func, ast.Name):
                            called.add(node.func.id)
                        elif isinstance(node.func, ast.Attribute):
                            called.add(node.func.attr)
            except SyntaxError:
                pass
        # JS/TS
        elif filename.endswith((".js", ".jsx", ".ts", ".tsx")):
            fn_pattern = re.compile(
                r'(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)'
                r'|(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\('
            )
            for m in fn_pattern.finditer(code):
                name = m.group(1) or m.group(2)
                if name and not name.startswith("_"):
                    line = code[:m.start()].count("\n") + 1
                    defined[name] = (filename, line)
            # Find all identifiers used as calls
            for m in re.finditer(r'(\w+)\s*\(', code):
                called.add(m.group(1))

    dead = []
    skip = {"main", "setUp", "tearDown", "test_", "__init__", "run", "render",
            "export", "default", "constructor", "componentDidMount", "useEffect"}
    for fname, (ffile, fline) in defined.items():
        if fname not in called and not any(fname.startswith(s) for s in skip):
            dead.append(DeadFunction(
                file=ffile, function=fname, line=fline,
                reason="Defined but never called in this repository",
            ))
    return dead[:20]


# ── Architecture layer detection ──────────────────────────────────────────────

def _detect_architecture_layers(files: Dict[str, str]) -> List[ArchLayer]:
    layers: Dict[str, List[str]] = {
        "controller": [], "model": [], "service": [],
        "util": [], "test": [], "config": [], "unknown": [],
    }
    patterns = {
        "test":       r"test_|_test\.py$|spec\.",
        "config":     r"config|settings|env\.|\.env",
        "model":      r"model|schema|entity|orm|db\.",
        "controller": r"view|controller|route|handler|endpoint|api\.",
        "service":    r"service|manager|processor|worker",
        "util":       r"util|helper|common|shared|mixin|base\.",
    }
    for filename in files:
        fn_lower = filename.lower()
        matched = "unknown"
        for layer, pattern in patterns.items():
            if re.search(pattern, fn_lower):
                matched = layer
                break
        layers[matched].append(filename)

    return [ArchLayer(layer=k, files=v) for k, v in layers.items() if v]


# ── Main entry point ──────────────────────────────────────────────────────────

def analyze_repository(files: Dict[str, str]) -> RepoIntelligenceReport:
    """
    Full repository intelligence analysis.
    Runs everything in parallel where possible.
    Returns a comprehensive report with no AI calls.
    """
    report = RepoIntelligenceReport()
    report.total_files = len(files)
    report.total_lines = sum(len(c.splitlines()) for c in files.values())

    py_files = {k: v for k, v in files.items() if k.endswith(".py")}

    # ── Parallel: static analysis per file ───────────────────────────────────
    def score_file(filename, code):
        from analyzers.quality_score import QualityReport
        import re as _re

        try:
            # ── Python: full pylint + bandit + flake8 ──
            if filename.endswith(".py"):
                from analyzers.code_parser import parse_code
                static = run_all_parallel(code)
                parsed = parse_code(code, "python")
                q = calculate_score(
                    static["pylint"], static["bandit"], static["flake8"],
                    function_count=len(parsed.functions),
                    line_count=len(code.splitlines()),
                )
                return filename, q, len(parsed.functions), "python", static

            # ── JS / TS / JSX / TSX ──
            elif filename.endswith((".js", ".jsx", ".ts", ".tsx")):
                loc = len(code.splitlines())
                console_logs  = len(_re.findall(r'\bconsole\.(log|warn|error)\b', code))
                todos         = len(_re.findall(r'\b(TODO|FIXME|HACK|XXX)\b', code))
                any_type      = len(_re.findall(r':\s*any\b', code))          # TS bad practice
                eval_use      = len(_re.findall(r'\beval\s*\(', code))
                hardcoded_key = len(_re.findall(r'(?:password|secret|api_?key)\s*=\s*["\'][^"\']{4,}', code, _re.I))
                no_error_hdl  = len(_re.findall(r'\.catch\s*\(\s*\)', code))  # empty catch
                fn_pattern    = _re.compile(
                    r'(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+(\w+)'
                    r'|(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\('
                )
                fn_count = len(fn_pattern.findall(code))
                smells   = console_logs + todos + any_type + no_error_hdl
                bugs     = eval_use + hardcoded_key
                sec      = eval_use * 2 + hardcoded_key * 3
                score    = round(max(0.0, min(10.0, 10 - bugs * 1.5 - sec * 0.5 - smells * 0.2)), 1)
                grade    = "A+" if score >= 9 else "A" if score >= 8 else "B" if score >= 7 else "C" if score >= 6 else "D" if score >= 5 else "F"
                issues   = []
                if console_logs:  issues.append(f"{console_logs} console.log statements")
                if todos:         issues.append(f"{todos} TODO/FIXME comments")
                if any_type:      issues.append(f"{any_type} TypeScript 'any' types")
                if eval_use:      issues.append(f"{eval_use} eval() calls (security risk)")
                if hardcoded_key: issues.append(f"{hardcoded_key} hardcoded secrets")
                if no_error_hdl:  issues.append(f"{no_error_hdl} empty .catch() handlers")
                q = QualityReport(score=score, grade=grade, bugs=bugs,
                                  security_issues=sec, code_smells=smells,
                                  complexity="N/A", issues=issues)
                return filename, q, fn_count, "javascript", {}

            # ── Java ──
            elif filename.endswith(".java"):
                loc = len(code.splitlines())
                system_out    = len(_re.findall(r'System\.out\.print', code))
                todos         = len(_re.findall(r'\b(TODO|FIXME|HACK)\b', code))
                catch_empty   = len(_re.findall(r'catch\s*\([^)]+\)\s*\{\s*\}', code))
                hardcoded_key = len(_re.findall(r'(?:password|secret)\s*=\s*"[^"]{4,}"', code, _re.I))
                fn_count      = len(_re.findall(r'(?:public|private|protected)\s+\w+\s+\w+\s*\(', code))
                smells        = system_out + todos + catch_empty
                bugs          = catch_empty
                sec           = hardcoded_key * 3
                score         = round(max(0.0, min(10.0, 10 - bugs * 1.5 - sec * 0.5 - smells * 0.2)), 1)
                grade         = "A+" if score >= 9 else "A" if score >= 8 else "B" if score >= 7 else "C" if score >= 6 else "D" if score >= 5 else "F"
                issues        = []
                if system_out:    issues.append(f"{system_out} System.out.print calls")
                if catch_empty:   issues.append(f"{catch_empty} empty catch blocks")
                if hardcoded_key: issues.append(f"{hardcoded_key} hardcoded secrets")
                q = QualityReport(score=score, grade=grade, bugs=bugs,
                                  security_issues=sec, code_smells=smells,
                                  complexity="N/A", issues=issues)
                return filename, q, fn_count, "java", {}

            # ── CSS / SCSS ──
            elif filename.endswith((".css", ".scss", ".sass")):
                important_count = len(_re.findall(r'!important', code))
                inline_style    = len(_re.findall(r'style\s*=', code))
                smells          = important_count + inline_style
                score           = round(max(0.0, min(10.0, 9 - smells * 0.3)), 1)
                grade           = "A" if score >= 8 else "B" if score >= 7 else "C"
                issues          = []
                if important_count: issues.append(f"{important_count} !important overrides")
                q = QualityReport(score=score, grade=grade, bugs=0,
                                  security_issues=0, code_smells=smells,
                                  complexity="N/A", issues=issues)
                return filename, q, 0, "css", {}

            # ── HTML ──
            elif filename.endswith((".html", ".htm")):
                inline_js    = len(_re.findall(r'<script[^>]*>(?!.*src)', code))
                inline_style = len(_re.findall(r'style\s*=\s*"', code))
                no_alt       = len(_re.findall(r'<img(?![^>]*alt=)', code))
                smells       = inline_js + inline_style + no_alt
                score        = round(max(0.0, min(10.0, 9 - smells * 0.2)), 1)
                grade        = "A" if score >= 8 else "B" if score >= 7 else "C"
                issues       = []
                if inline_js:    issues.append(f"{inline_js} inline script blocks")
                if no_alt:       issues.append(f"{no_alt} images missing alt attribute")
                q = QualityReport(score=score, grade=grade, bugs=0,
                                  security_issues=0, code_smells=smells,
                                  complexity="N/A", issues=issues)
                return filename, q, 0, "html", {}

            # ── SQL ──
            elif filename.endswith(".sql"):
                select_star  = len(_re.findall(r'SELECT\s+\*', code, _re.I))
                no_where     = len(_re.findall(r'DELETE\s+FROM\s+\w+\s*;', code, _re.I))
                smells       = select_star + no_where
                score        = round(max(0.0, min(10.0, 9 - smells * 0.5)), 1)
                grade        = "A" if score >= 8 else "B" if score >= 7 else "C"
                issues       = []
                if select_star: issues.append(f"{select_star} SELECT * queries")
                if no_where:    issues.append(f"{no_where} DELETE without WHERE")
                q = QualityReport(score=score, grade=grade, bugs=no_where,
                                  security_issues=0, code_smells=smells,
                                  complexity="N/A", issues=issues)
                return filename, q, 0, "sql", {}

            else:
                q = QualityReport(score=7.0, grade="B", bugs=0,
                                  security_issues=0, code_smells=0, complexity="N/A")
                return filename, q, 0, "other", {}

        except Exception:
            q = QualityReport(score=5.0, grade="C", bugs=0,
                              security_issues=0, code_smells=0, complexity="N/A")
            return filename, q, 0, "unknown", {}

    file_scores = []
    total_funcs = 0
    lang_breakdown: Dict[str, int] = {}
    all_detailed_issues: Dict[str, list] = {}

    with ThreadPoolExecutor(max_workers=8) as ex:
        futures = {ex.submit(score_file, fn, code): fn for fn, code in files.items()}
        for fut in as_completed(futures):
            fn, q, nfuncs, lang, static_out = fut.result()
            file_scores.append({"file": fn, "score": q.score, "grade": q.grade,
                                 "bugs": q.bugs, "security": q.security_issues,
                                 "smells": q.code_smells, "lang": lang,
                                 "issues": q.issues})
            total_funcs += nfuncs
            lang_breakdown[lang] = lang_breakdown.get(lang, 0) + 1
            # Extract detailed issues
            code = files[fn]
            detailed = extract_issues(
                fn, code,
                pylint_out=static_out.get("pylint", ""),
                bandit_out=static_out.get("bandit", ""),
                flake8_out=static_out.get("flake8", ""),
            )
            all_detailed_issues[fn] = detailed

    report.total_functions = total_funcs
    report.file_scores = sorted(file_scores, key=lambda x: x["score"])
    report.lang_breakdown = lang_breakdown
    if file_scores:
        report.avg_quality_score = round(sum(f["score"] for f in file_scores) / len(file_scores), 1)
        mid = file_scores[len(file_scores)//2]
        report.avg_grade = mid["grade"]

    # ── Complexity hotspots ───────────────────────────────────────────────────
    all_complexity = []
    for filename, code in files.items():  # all files, not just Python
        all_complexity.extend(_analyze_complexity(filename, code))
    all_complexity.sort(key=lambda x: x.complexity, reverse=True)
    report.complexity_hotspots = [
        {"file": c.file, "function": c.function, "complexity": c.complexity,
         "line": c.line, "loc": c.lines_of_code,
         "risk": "critical" if c.complexity > 15 else "high" if c.complexity > 10 else "medium" if c.complexity > 5 else "low"}
        for c in all_complexity[:15]
    ]

    # ── Cross-file duplicates ─────────────────────────────────────────────────
    clusters = _find_cross_file_duplicates(files)
    report.duplicate_clusters = [
        {"similarity": c.similarity,
         "functions": c.functions,
         "snippet": c.snippet,
         "cross_file": len(set(f["file"] for f in c.functions)) > 1}
        for c in clusters[:10]
    ]

    # ── Coupling map ──────────────────────────────────────────────────────────
    coupling = _build_coupling_map(files)
    report.coupling_map = [
        {"file": c.file, "imported_by": c.imported_by,
         "imports_count": c.imports_count, "coupling_score": c.coupling_score,
         "risk": "high" if c.coupling_score > 0.6 else "medium" if c.coupling_score > 0.3 else "low"}
        for c in coupling[:10]
    ]

    # ── Dead code ─────────────────────────────────────────────────────────────
    dead = _find_dead_code(files)
    report.dead_functions = [
        {"file": d.file, "function": d.function, "line": d.line, "reason": d.reason}
        for d in dead
    ]

    # ── Architecture layers ───────────────────────────────────────────────────
    layers = _detect_architecture_layers(files)
    report.architecture_layers = [
        {"layer": l.layer, "files": l.files, "count": len(l.files)}
        for l in layers
    ]

    # ── Cross-file taint ──────────────────────────────────────────────────────
    taint_result = analyze_cross_file_taint(py_files)
    report.cross_file_taint = [
        {
            "severity": p.severity,
            "hops": p.hops,
            "source_file": p.source.file,
            "source_function": p.source.function,
            "source_variable": p.source.variable,
            "source_type": p.source.source_type,
            "source_line": p.source.line,
            "sink_file": p.sink.file,
            "sink_function": p.sink.function,
            "sink_call": p.sink.sink_call,
            "risk": p.sink.risk,
            "sink_line": p.sink.line,
            "path": p.path,
        }
        for p in taint_result.paths[:20]
    ]
    report.taint_summary = {
        "total_sources": taint_result.total_sources,
        "total_paths": len(taint_result.paths),
        "cross_file_paths": taint_result.cross_file_paths,
        "same_file_paths": taint_result.same_file_paths,
    }

    # ── Riskiest files ────────────────────────────────────────────────────────
    risk_scores: Dict[str, float] = {}
    for fs in file_scores:
        risk_scores[fs["file"]] = risk_scores.get(fs["file"], 0) + (10 - fs["score"])
    for c in coupling[:5]:
        risk_scores[c.file] = risk_scores.get(c.file, 0) + c.coupling_score * 3
    for p in taint_result.paths:
        risk_scores[p.source.file] = risk_scores.get(p.source.file, 0) + 5
        risk_scores[p.sink.file]   = risk_scores.get(p.sink.file, 0) + 5
    report.riskiest_files = sorted(risk_scores, key=risk_scores.get, reverse=True)[:5]

    # ── Detailed issues (all files, sorted by severity) ───────────────────────
    flat_issues = []
    for fn, issues in all_detailed_issues.items():
        for issue in issues:
            flat_issues.append({
                "file": issue.file,
                "line": issue.line,
                "col": issue.col,
                "severity": issue.severity,
                "category": issue.category,
                "code": issue.code,
                "message": issue.message,
                "fix_hint": issue.fix_hint,
                "tool": issue.tool,
            })
    # Sort: critical first, then by file
    sev_order = {"critical": 0, "high": 1, "medium": 2, "low": 3, "info": 4}
    flat_issues.sort(key=lambda x: (sev_order.get(x["severity"], 5), x["file"], x["line"]))
    report.detailed_issues = flat_issues[:200]  # cap at 200

    # ── Improvement recommendations ───────────────────────────────────────────
    improvements = generate_improvements(
        files=files,
        all_issues=all_detailed_issues,
        complexity_hotspots=report.complexity_hotspots,
        duplicate_clusters=report.duplicate_clusters,
        dead_functions=report.dead_functions,
        coupling_map=report.coupling_map,
        cross_file_taint=report.cross_file_taint,
    )
    report.improvements = [
        {
            "priority": imp.priority,
            "category": imp.category,
            "title": imp.title,
            "description": imp.description,
            "affected_files": imp.affected_files,
            "affected_lines": imp.affected_lines,
            "effort": imp.effort,
            "impact": imp.impact,
            "how_to_fix": imp.how_to_fix,
        }
        for imp in improvements
    ]

    return report

