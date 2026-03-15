"""
Code Knowledge Graph Builder
Extracts file→import, function→call, class→method relationships
and returns a graph structure for D3 visualization.
"""
import re
import ast
from dataclasses import dataclass, field
from typing import List, Dict, Set, Tuple


@dataclass
class GraphNode:
    id: str
    label: str
    type: str        # "file" | "function" | "class" | "module"
    file: str = ""
    line: int = 0
    size: int = 1    # relative importance (call count, etc.)


@dataclass
class GraphEdge:
    source: str
    target: str
    type: str        # "imports" | "calls" | "defines" | "inherits"
    weight: int = 1


@dataclass
class KnowledgeGraph:
    nodes: List[GraphNode] = field(default_factory=list)
    edges: List[GraphEdge] = field(default_factory=list)
    stats: Dict = field(default_factory=dict)


def build_knowledge_graph(files: Dict[str, str]) -> KnowledgeGraph:
    """Build a knowledge graph from a dict of {filename: code}."""
    graph = KnowledgeGraph()
    node_ids: Set[str] = set()

    def add_node(node: GraphNode):
        if node.id not in node_ids:
            graph.nodes.append(node)
            node_ids.add(node.id)

    def add_edge(edge: GraphEdge):
        graph.edges.append(edge)

    all_function_names: Dict[str, str] = {}  # func_name → file

    # Pass 1: collect all nodes
    for filename, code in files.items():
        file_id = f"file:{filename}"
        add_node(GraphNode(id=file_id, label=filename, type="file", file=filename))

        try:
            tree = ast.parse(code)
        except SyntaxError:
            _parse_js_nodes(filename, code, graph, node_ids, add_node, add_edge)
            continue

        for node in ast.walk(tree):
            # Functions
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                fn_id = f"fn:{filename}:{node.name}"
                all_function_names[node.name] = filename
                add_node(GraphNode(
                    id=fn_id, label=node.name, type="function",
                    file=filename, line=node.lineno,
                ))
                add_edge(GraphEdge(source=file_id, target=fn_id, type="defines"))

            # Classes
            elif isinstance(node, ast.ClassDef):
                cls_id = f"cls:{filename}:{node.name}"
                add_node(GraphNode(
                    id=cls_id, label=node.name, type="class",
                    file=filename, line=node.lineno,
                ))
                add_edge(GraphEdge(source=file_id, target=cls_id, type="defines"))

                # Inheritance
                for base in node.bases:
                    base_name = _get_name(base)
                    if base_name:
                        base_id = f"cls:?:{base_name}"
                        add_node(GraphNode(id=base_id, label=base_name, type="class"))
                        add_edge(GraphEdge(source=cls_id, target=base_id, type="inherits"))

                # Methods inside class
                for item in node.body:
                    if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                        m_id = f"fn:{filename}:{node.name}.{item.name}"
                        add_node(GraphNode(
                            id=m_id, label=f"{node.name}.{item.name}",
                            type="function", file=filename, line=item.lineno,
                        ))
                        add_edge(GraphEdge(source=cls_id, target=m_id, type="defines"))

            # Imports
            elif isinstance(node, ast.Import):
                for alias in node.names:
                    mod_id = f"mod:{alias.name}"
                    add_node(GraphNode(id=mod_id, label=alias.name, type="module"))
                    add_edge(GraphEdge(source=file_id, target=mod_id, type="imports"))

            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    mod_id = f"mod:{node.module}"
                    add_node(GraphNode(id=mod_id, label=node.module, type="module"))
                    add_edge(GraphEdge(source=file_id, target=mod_id, type="imports"))

    # Pass 2: function call edges
    for filename, code in files.items():
        try:
            tree = ast.parse(code)
        except SyntaxError:
            continue

        for fn_node in ast.walk(tree):
            if not isinstance(fn_node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                continue
            caller_id = f"fn:{filename}:{fn_node.name}"
            for child in ast.walk(fn_node):
                if isinstance(child, ast.Call):
                    callee = _get_name(child.func)
                    if callee and callee in all_function_names:
                        callee_file = all_function_names[callee]
                        callee_id = f"fn:{callee_file}:{callee}"
                        if caller_id != callee_id:
                            add_edge(GraphEdge(
                                source=caller_id, target=callee_id,
                                type="calls", weight=1,
                            ))
                            # Boost target node size
                            for n in graph.nodes:
                                if n.id == callee_id:
                                    n.size += 1

    graph.stats = {
        "total_nodes": len(graph.nodes),
        "total_edges": len(graph.edges),
        "files": len([n for n in graph.nodes if n.type == "file"]),
        "functions": len([n for n in graph.nodes if n.type == "function"]),
        "classes": len([n for n in graph.nodes if n.type == "class"]),
        "modules": len([n for n in graph.nodes if n.type == "module"]),
    }
    return graph


def _get_name(node) -> str:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    return ""


def _parse_js_nodes(filename, code, graph, node_ids, add_node, add_edge):
    """Regex-based JS/TS node extraction."""
    file_id = f"file:{filename}"
    # Functions
    for m in re.finditer(r'(?:function\s+(\w+)|(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s*)?\()', code):
        name = m.group(1) or m.group(2)
        if name:
            fn_id = f"fn:{filename}:{name}"
            if fn_id not in node_ids:
                graph.nodes.append(GraphNode(id=fn_id, label=name, type="function", file=filename))
                node_ids.add(fn_id)
                graph.edges.append(GraphEdge(source=file_id, target=fn_id, type="defines"))
    # Imports
    for m in re.finditer(r"import\s+.+\s+from\s+['\"](.+)['\"]", code):
        mod = m.group(1)
        mod_id = f"mod:{mod}"
        if mod_id not in node_ids:
            graph.nodes.append(GraphNode(id=mod_id, label=mod, type="module"))
            node_ids.add(mod_id)
        graph.edges.append(GraphEdge(source=file_id, target=mod_id, type="imports"))
