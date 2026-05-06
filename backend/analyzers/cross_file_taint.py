"""
Cross-File Taint Tracker
========================
Tracks user-controlled data that flows ACROSS file boundaries.

Example:
  views.py:   user_id = request.args['id']          ← SOURCE
  views.py:   result  = get_user(user_id)            ← passes tainted arg
  models.py:  def get_user(uid):
  models.py:      db.execute("SELECT * WHERE id="+uid)  ← SINK in different file

A single-file taint analyzer misses this entirely.
AI cannot do this — it requires following the call graph across files.
"""
import ast
from dataclasses import dataclass, field
from typing import Dict, List, Set, Optional, Tuple

# ── Constants ─────────────────────────────────────────────────────────────────

USER_SOURCES = {
    "request", "input", "argv", "environ", "form",
    "args", "params", "query", "body", "data", "json",
    "get_json", "get_data",
}

DANGEROUS_SINKS = {
    "execute":      "SQL Injection",
    "executemany":  "SQL Injection",
    "raw":          "SQL Injection",
    "eval":         "Code Injection",
    "exec":         "Code Injection",
    "system":       "Command Injection",
    "popen":        "Command Injection",
    "run":          "Command Injection",
    "open":         "Path Traversal",
    "pickle.loads": "Insecure Deserialization",
    "loads":        "Insecure Deserialization",
    "render_template_string": "Server-Side Template Injection",
}

# ── Data models ───────────────────────────────────────────────────────────────

@dataclass
class TaintSource:
    file: str
    function: str
    variable: str
    source_type: str   # e.g. "request.args"
    line: int

@dataclass
class TaintSink:
    file: str
    function: str
    sink_call: str
    risk: str
    line: int

@dataclass
class CrossFileTaintPath:
    source: TaintSource
    sink: TaintSink
    path: List[str]          # ["views.py:get_user(user_id)", "models.py:db.execute(uid)"]
    hops: int                # number of file boundaries crossed
    severity: str            # "critical" | "high" | "medium"

@dataclass
class CrossFileTaintResult:
    paths: List[CrossFileTaintPath] = field(default_factory=list)
    total_sources: int = 0
    total_sinks: int = 0
    cross_file_paths: int = 0
    same_file_paths: int = 0


# ── Pass 1: Extract function signatures and their parameters ──────────────────

def _extract_functions(filename: str, code: str) -> Dict[str, List[str]]:
    """Returns {func_name: [param_names]} for all functions in a file."""
    funcs = {}
    try:
        tree = ast.parse(code)
        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                params = [a.arg for a in node.args.args if a.arg != "self"]
                funcs[node.name] = params
    except SyntaxError:
        pass
    return funcs


# ── Pass 2: Find taint sources per file ──────────────────────────────────────

def _find_sources(filename: str, code: str) -> List[TaintSource]:
    """Find all variables assigned from user-controlled sources."""
    sources = []
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return sources

    current_func = [None]

    class SourceVisitor(ast.NodeVisitor):
        def visit_FunctionDef(self, node):
            prev = current_func[0]
            current_func[0] = node.name
            self.generic_visit(node)
            current_func[0] = prev
        visit_AsyncFunctionDef = visit_FunctionDef

        def visit_Assign(self, node):
            if not hasattr(ast, "unparse"):
                self.generic_visit(node)
                return
            val_str = ast.unparse(node.value).lower()
            for src in USER_SOURCES:
                if src in val_str:
                    for target in node.targets:
                        if isinstance(target, ast.Name):
                            sources.append(TaintSource(
                                file=filename,
                                function=current_func[0] or "<module>",
                                variable=target.id,
                                source_type=src,
                                line=node.lineno,
                            ))
            self.generic_visit(node)

    SourceVisitor().visit(tree)
    return sources


# ── Pass 3: Find function calls that pass tainted args ────────────────────────

def _find_tainted_calls(filename: str, code: str,
                        tainted_vars: Set[str]) -> List[Tuple[str, str, int, List[int]]]:
    """
    Returns list of (callee_name, caller_func, line, [tainted_arg_positions])
    for calls where tainted variables are passed as arguments.
    """
    calls = []
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return calls

    current_func = [None]

    class CallVisitor(ast.NodeVisitor):
        def visit_FunctionDef(self, node):
            prev = current_func[0]
            current_func[0] = node.name
            self.generic_visit(node)
            current_func[0] = prev
        visit_AsyncFunctionDef = visit_FunctionDef

        def visit_Call(self, node):
            if not hasattr(ast, "unparse"):
                self.generic_visit(node)
                return
            callee = ""
            if isinstance(node.func, ast.Name):
                callee = node.func.id
            elif isinstance(node.func, ast.Attribute):
                callee = node.func.attr

            tainted_positions = []
            for i, arg in enumerate(node.args):
                arg_str = ast.unparse(arg)
                if any(tv in arg_str for tv in tainted_vars):
                    tainted_positions.append(i)

            if callee and tainted_positions:
                calls.append((callee, current_func[0] or "<module>",
                               node.lineno, tainted_positions))
            self.generic_visit(node)

    CallVisitor().visit(tree)
    return calls


# ── Pass 4: Find sinks in a file ──────────────────────────────────────────────

def _find_sinks(filename: str, code: str,
                tainted_vars: Set[str]) -> List[TaintSink]:
    """Find dangerous sink calls that use tainted variables."""
    sinks = []
    try:
        tree = ast.parse(code)
    except SyntaxError:
        return sinks

    current_func = [None]

    class SinkVisitor(ast.NodeVisitor):
        def visit_FunctionDef(self, node):
            prev = current_func[0]
            current_func[0] = node.name
            self.generic_visit(node)
            current_func[0] = prev
        visit_AsyncFunctionDef = visit_FunctionDef

        def visit_Call(self, node):
            if not hasattr(ast, "unparse"):
                self.generic_visit(node)
                return
            func_name = ""
            if isinstance(node.func, ast.Attribute):
                func_name = node.func.attr
            elif isinstance(node.func, ast.Name):
                func_name = node.func.id

            if func_name in DANGEROUS_SINKS:
                for arg in node.args:
                    arg_str = ast.unparse(arg)
                    if any(tv in arg_str for tv in tainted_vars):
                        sinks.append(TaintSink(
                            file=filename,
                            function=current_func[0] or "<module>",
                            sink_call=f"{func_name}({arg_str[:60]})",
                            risk=DANGEROUS_SINKS[func_name],
                            line=node.lineno,
                        ))
            self.generic_visit(node)

    SinkVisitor().visit(tree)
    return sinks


# ── Main cross-file taint analysis ───────────────────────────────────────────

def analyze_cross_file_taint(files: Dict[str, str]) -> CrossFileTaintResult:
    """
    Full cross-file taint analysis.
    1. Find all taint sources across all files
    2. For each source, follow function calls across file boundaries
    3. Check if tainted data reaches a dangerous sink in any file
    """
    result = CrossFileTaintResult()

    # Build function registry: func_name → (file, param_list)
    func_registry: Dict[str, Tuple[str, List[str]]] = {}
    for filename, code in files.items():
        if not filename.endswith(".py"):
            continue
        for fname, params in _extract_functions(filename, code).items():
            func_registry[fname] = (filename, params)

    # Find all sources
    all_sources: List[TaintSource] = []
    for filename, code in files.items():
        if not filename.endswith(".py"):
            continue
        all_sources.extend(_find_sources(filename, code))

    result.total_sources = len(all_sources)

    # For each source, propagate taint across files
    for source in all_sources:
        tainted: Set[str] = {source.variable}
        visited_funcs: Set[str] = set()
        path = [f"{source.file}:{source.function}() ← {source.source_type} → `{source.variable}`"]

        # BFS across function calls
        queue = [(source.file, source.function, tainted.copy(), path.copy())]
        found_sinks: List[TaintSink] = []

        while queue:
            cur_file, cur_func, cur_tainted, cur_path = queue.pop(0)
            key = f"{cur_file}:{cur_func}"
            if key in visited_funcs:
                continue
            visited_funcs.add(key)

            code = files.get(cur_file, "")

            # Check for sinks in current file
            sinks = _find_sinks(cur_file, code, cur_tainted)
            for sink in sinks:
                found_sinks.append(sink)
                hops = sum(1 for p in cur_path if "→" in p and p.split(":")[0] != cur_file)
                severity = "critical" if sink.risk in ("SQL Injection", "Code Injection", "Command Injection") else "high"
                result.paths.append(CrossFileTaintPath(
                    source=source,
                    sink=sink,
                    path=cur_path + [f"{sink.file}:{sink.function}() → {sink.sink_call}"],
                    hops=hops,
                    severity=severity,
                ))
                if cur_file != source.file:
                    result.cross_file_paths += 1
                else:
                    result.same_file_paths += 1

            # Follow tainted args into called functions (cross-file propagation)
            tainted_calls = _find_tainted_calls(cur_file, code, cur_tainted)
            for callee_name, caller_func, line, tainted_positions in tainted_calls:
                if callee_name in func_registry:
                    callee_file, callee_params = func_registry[callee_name]
                    # Map tainted arg positions to parameter names
                    new_tainted = set()
                    for pos in tainted_positions:
                        if pos < len(callee_params):
                            new_tainted.add(callee_params[pos])
                    if new_tainted:
                        new_path = cur_path + [
                            f"{cur_file}:{caller_func}() → calls {callee_name}({', '.join(new_tainted)}) in {callee_file}"
                        ]
                        queue.append((callee_file, callee_name, new_tainted, new_path))

    result.total_sinks = len(result.paths)
    # Deduplicate paths by (source.file, source.variable, sink.file, sink.sink_call)
    seen = set()
    unique = []
    for p in result.paths:
        key = (p.source.file, p.source.variable, p.sink.file, p.sink.sink_call[:40])
        if key not in seen:
            seen.add(key)
            unique.append(p)
    result.paths = unique
    return result
