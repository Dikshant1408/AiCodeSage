"""Concise prompts — shorter = faster Groq responses."""

def code_review_prompt(code: str) -> str:
    return f"Review this code. List bugs (line#), security issues, top 3 improvements. Max 200 words.\n```\n{code[:1500]}\n```"

def bug_detection_prompt(code: str) -> str:
    return f"Find bugs in this code: crashes, logic errors, infinite loops, off-by-one. List each with line# and fix. Max 200 words.\n```\n{code[:1500]}\n```"

def security_prompt(code: str) -> str:
    return f"Security audit. Find: SQL injection, eval/exec misuse, hardcoded secrets, path traversal. Rate each High/Medium/Low. Max 200 words.\n```\n{code[:1500]}\n```"

def autofix_prompt(code: str, issue: str) -> str:
    return f"Fix this issue: {issue}\nReturn unified diff only.\n```\n{code[:1500]}\n```"

def architecture_prompt(files_summary: str) -> str:
    return f"Summarize this codebase architecture in 150 words: pattern, key modules, data flow, issues.\n{files_summary[:2000]}"

def technical_debt_prompt(code: str, quality_report: str) -> str:
    return f"Technical debt analysis. {quality_report}\nTop 3 debt items with effort estimate. Max 150 words.\n```\n{code[:1000]}\n```"

def complexity_refactor_prompt(func_name: str, func_body: str, line_count: int) -> str:
    return f"Function '{func_name}' is {line_count} lines. Suggest how to split it. Show refactored version. Max 200 words.\n```\n{func_body[:1000]}\n```"

def debug_prompt(error: str, code: str = "") -> str:
    ctx = f"\n```\n{code[:800]}\n```" if code else ""
    return f"Debug: {error[:500]}{ctx}\nRoot cause + fix in 150 words."

def semantic_search_prompt(query: str, code_context: str) -> str:
    return f"Find '{query}' in this codebase. Return file, line, explanation.\n{code_context[:3000]}"

def bug_fix_agent_prompt(filename: str, issue: str, code_snippet: str, full_code: str) -> str:
    return f"""Fix this issue in {filename}: {issue}
```
{code_snippet[:800]}
```
EXPLANATION: <one sentence>
CONFIDENCE: <high|medium|low>
PATCH:
--- {filename}
+++ {filename}
<unified diff>"""

def knowledge_graph_summary_prompt(stats: dict) -> str:
    return f"Codebase: {stats.get('files',0)} files, {stats.get('functions',0)} functions, {stats.get('classes',0)} classes. Summarize architecture in 2 sentences."

def pr_review_prompt(diff: str, context: str = "") -> str:
    return f"Review this PR diff. List issues as: LINE <n>: [critical|warning|suggestion] <comment>. Max 200 words.\n```diff\n{diff[:2000]}\n```"

def autopilot_prompt(issues_summary: str, code: str) -> str:
    return f"Issues: {issues_summary}\nList top 3 fixes with line numbers. Max 150 words.\n```\n{code[:1000]}\n```"

def architecture_refactor_prompt(architecture_summary: str) -> str:
    return f"Suggest architecture improvements for: {architecture_summary[:1000]}\nTop 3 changes with rationale. Max 150 words."

def learning_mode_prompt(code: str, level: str = "beginner") -> str:
    return f"Explain this code to a {level}. What it does, how it works, key concepts. Max 200 words.\n```\n{code[:1500]}\n```"

def model_benchmark_prompt(code: str, task: str = "review") -> str:
    return f"Task: {task}\n```\n{code[:800]}\n```\nBrief structured analysis."

def semantic_nav_prompt(query: str, code_chunks: str) -> str:
    return f"Find '{query}' in codebase. Return: FILE | LINE | MATCH description.\n{code_chunks[:3000]}"
