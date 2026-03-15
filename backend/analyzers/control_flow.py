"""
Control Flow & Data Flow Analyzer using Python AST.
Detects: branch paths, infinite loop risks, data flow (taint tracking), SQL injection paths.
"""
import ast
import re
from dataclasses import dataclass, field
from typing import List, Dict, Tuple

@dataclass
class BranchPath:
    function: str
    condition: str
    true_path: str
    false_path: str
    line: int

@dataclass
class DataFlowIssue:
    variable: str
    source: str
    sink: str
    risk: str
    line: int

@dataclass
class ControlFlowResult:
    branch_paths: List[BranchPath] = field(default_factory=list)
    infinite_loop_risks: List[Dict] = field(default_factory=list)
    data_flow_issues: List[DataFlowIssue] = field(default_factory=list)
    function_complexity: Dict[str, int] = field(default_factory=dict)

# Dangerous sinks for taint analysis
DANGEROUS_SINKS = {
    "execute": "SQL Injection",
    "executemany": "SQL Injection",
    "raw": "SQL Injection",
    "eval": "Code Injection",
    "exec": "Code Injection",
    "system": "Command Injection",
    "popen": "Command Injection",
    "subprocess.run": "Command Injection",
    "open": "Path Traversal",
    "pickle.loads": "Insecure Deserialization",
}

# User-controlled sources
USER_SOURCES = {"request", "input", "argv", "environ", "form", "args", "params", "query", "body", "data"}

class ControlFlowVisitor(ast.NodeVisitor):
    def __init__(self):
        self.result = ControlFlowResult()
        self._current_func = None
        self._tainted: Dict[str, str] = {}  # var_name -> source

    def visit_FunctionDef(self, node):
        prev = self._current_func
        self._current_func = node.name
        complexity = 1
        for child in ast.walk(node):
            if isinstance(child, (ast.If, ast.While, ast.For, ast.ExceptHandler,
                                   ast.With, ast.Assert, ast.comprehension)):
                complexity += 1
        self.result.function_complexity[node.name] = complexity
        self.generic_visit(node)
        self._current_func = prev

    visit_AsyncFunctionDef = visit_FunctionDef

    def visit_If(self, node):
        if self._current_func:
            cond = ast.unparse(node.test) if hasattr(ast, 'unparse') else "condition"
            true_stmts = [ast.unparse(s) if hasattr(ast, 'unparse') else "..." for s in node.body[:2]]
            false_stmts = [ast.unparse(s) if hasattr(ast, 'unparse') else "..." for s in node.orelse[:2]]
            self.result.branch_paths.append(BranchPath(
                function=self._current_func,
                condition=cond,
                true_path=" → ".join(true_stmts) or "pass",
                false_path=" → ".join(false_stmts) or "pass",
                line=node.lineno,
            ))
        self.generic_visit(node)

    def visit_While(self, node):
        # Detect potential infinite loops: while True with no break
        cond = ast.unparse(node.test) if hasattr(ast, 'unparse') else "?"
        has_break = any(isinstance(n, ast.Break) for n in ast.walk(node))
        has_return = any(isinstance(n, ast.Return) for n in ast.walk(node))
        if not has_break and not has_return:
            self.result.infinite_loop_risks.append({
                "function": self._current_func or "module",
                "condition": cond,
                "line": node.lineno,
                "risk": "No break/return found — possible infinite loop",
            })
        self.generic_visit(node)

    def visit_Assign(self, node):
        # Track tainted variables from user input sources
        if hasattr(ast, 'unparse'):
            val_str = ast.unparse(node.value).lower()
            for src in USER_SOURCES:
                if src in val_str:
                    for target in node.targets:
                        if isinstance(target, ast.Name):
                            self._tainted[target.id] = src
        self.generic_visit(node)

    def visit_Call(self, node):
        # Check if tainted data flows into dangerous sinks
        func_name = ""
        if isinstance(node.func, ast.Attribute):
            func_name = node.func.attr
        elif isinstance(node.func, ast.Name):
            func_name = node.func.id

        if func_name in DANGEROUS_SINKS and hasattr(ast, 'unparse'):
            for arg in node.args:
                arg_str = ast.unparse(arg)
                for tainted_var, source in self._tainted.items():
                    if tainted_var in arg_str:
                        self.result.data_flow_issues.append(DataFlowIssue(
                            variable=tainted_var,
                            source=source,
                            sink=f"{func_name}()",
                            risk=DANGEROUS_SINKS[func_name],
                            line=node.lineno,
                        ))
        self.generic_visit(node)

def analyze_control_flow(code: str) -> ControlFlowResult:
    """Run control flow + data flow analysis on Python code."""
    try:
        tree = ast.parse(code)
        visitor = ControlFlowVisitor()
        visitor.visit(tree)
        return visitor.result
    except SyntaxError as e:
        result = ControlFlowResult()
        result.data_flow_issues.append(DataFlowIssue(
            variable="N/A", source="N/A", sink="N/A",
            risk=f"Syntax error: {e}", line=0,
        ))
        return result
