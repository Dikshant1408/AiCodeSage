"""
Smart code parser using Tree-sitter.
Extracts functions, classes, imports from source files.
Falls back to regex if tree-sitter is unavailable.
"""
import re
from dataclasses import dataclass, field
from typing import List, Optional

@dataclass
class ParsedFunction:
    name: str
    body: str
    start_line: int
    end_line: int
    params: List[str] = field(default_factory=list)

@dataclass
class ParsedClass:
    name: str
    body: str
    start_line: int
    end_line: int
    methods: List[str] = field(default_factory=list)

@dataclass
class ParsedFile:
    language: str
    functions: List[ParsedFunction] = field(default_factory=list)
    classes: List[ParsedClass] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)
    raw: str = ""

def parse_code(code: str, language: str = "python") -> ParsedFile:
    """Parse code and extract structure. Uses tree-sitter if available, else regex."""
    try:
        return _parse_with_treesitter(code, language)
    except Exception:
        return _parse_with_regex(code, language)

def _parse_with_treesitter(code: str, language: str) -> ParsedFile:
    if language != "python":
        raise ValueError("tree-sitter only configured for python")

    import tree_sitter_python as tspython
    from tree_sitter import Language, Parser

    PY_LANGUAGE = Language(tspython.language())
    parser = Parser(PY_LANGUAGE)
    tree = parser.parse(bytes(code, "utf-8"))
    lines = code.splitlines()

    result = ParsedFile(language=language, raw=code)

    def get_text(node):
        return code[node.start_byte:node.end_byte]

    def walk(node):
        if node.type == "function_definition":
            name_node = node.child_by_field_name("name")
            params_node = node.child_by_field_name("parameters")
            name = get_text(name_node) if name_node else "unknown"
            params = []
            if params_node:
                for child in params_node.children:
                    if child.type in ("identifier", "typed_parameter", "default_parameter"):
                        params.append(get_text(child).split(":")[0].split("=")[0].strip())
            result.functions.append(ParsedFunction(
                name=name,
                body=get_text(node),
                start_line=node.start_point[0] + 1,
                end_line=node.end_point[0] + 1,
                params=params,
            ))
        elif node.type == "class_definition":
            name_node = node.child_by_field_name("name")
            name = get_text(name_node) if name_node else "unknown"
            methods = [
                get_text(c.child_by_field_name("name"))
                for c in node.children
                if c.type == "function_definition" and c.child_by_field_name("name")
            ]
            result.classes.append(ParsedClass(
                name=name,
                body=get_text(node),
                start_line=node.start_point[0] + 1,
                end_line=node.end_point[0] + 1,
                methods=methods,
            ))
        elif node.type == "import_statement" or node.type == "import_from_statement":
            result.imports.append(get_text(node))
        for child in node.children:
            walk(child)

    walk(tree.root_node)
    return result

def _parse_with_regex(code: str, language: str) -> ParsedFile:
    """Fallback regex-based parser."""
    result = ParsedFile(language=language, raw=code)
    lines = code.splitlines()

    # Extract functions
    func_pattern = re.compile(r'^(async\s+)?def\s+(\w+)\s*\(([^)]*)\)\s*:', re.MULTILINE)
    for m in func_pattern.finditer(code):
        start_line = code[:m.start()].count('\n') + 1
        name = m.group(2)
        params = [p.strip().split(':')[0].split('=')[0].strip() for p in m.group(3).split(',') if p.strip()]
        # grab body until next def/class at same indent or EOF
        body_lines = []
        in_body = False
        indent = len(lines[start_line - 1]) - len(lines[start_line - 1].lstrip())
        for i, line in enumerate(lines[start_line - 1:], start_line):
            if i == start_line:
                body_lines.append(line); in_body = True; continue
            if in_body and line.strip() and (len(line) - len(line.lstrip())) <= indent and line.strip():
                if re.match(r'(async\s+)?def\s+|class\s+', line.lstrip()):
                    break
            body_lines.append(line)
        result.functions.append(ParsedFunction(
            name=name, body='\n'.join(body_lines),
            start_line=start_line, end_line=start_line + len(body_lines),
            params=params,
        ))

    # Extract classes
    class_pattern = re.compile(r'^class\s+(\w+)', re.MULTILINE)
    for m in class_pattern.finditer(code):
        start_line = code[:m.start()].count('\n') + 1
        result.classes.append(ParsedClass(
            name=m.group(1), body="", start_line=start_line, end_line=start_line,
        ))

    # Extract imports
    import_pattern = re.compile(r'^(import|from)\s+.+', re.MULTILINE)
    result.imports = import_pattern.findall(code)

    return result
