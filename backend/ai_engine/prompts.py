def code_review_prompt(code: str) -> str:
    return f"""You are a senior software engineer. Review the following code.
Find and list:
- Bugs or logical errors
- Bad practices or anti-patterns
- Naming issues
- Performance problems
- Complexity issues

For each issue provide: Line number (if known), Issue description, Suggested fix.

Code:
```
{code}
```
"""

def bug_detection_prompt(code: str) -> str:
    return f"""Analyze the following code for:
- Logical errors
- Possible runtime crashes (IndexError, NullPointer, etc.)
- Infinite loops
- Unused variables
- Off-by-one errors

List each bug with line reference and explanation.

Code:
```
{code}
```
"""

def refactor_prompt(code: str) -> str:
    return f"""Refactor the following code to be cleaner, more readable, and follow best practices.
Show the improved version with a brief explanation of each change.

Code:
```
{code}
```
"""

def explain_prompt(code: str) -> str:
    return f"""Explain the following code step by step.
Include:
- What it does overall
- How each part works
- Time and space complexity (if applicable)

Code:
```
{code}
```
"""

def documentation_prompt(code: str) -> str:
    return f"""Generate complete documentation for the following code.
Include:
- Module/file description
- Function/class docstrings with parameters and return types
- Usage examples

Code:
```
{code}
```
"""

def security_prompt(code: str) -> str:
    return f"""Perform a security analysis on the following code.
Check for:
- SQL injection vulnerabilities
- Unsafe use of eval() or exec()
- Hardcoded secrets or API keys
- Insecure deserialization
- Path traversal risks
- Missing input validation

List each vulnerability with severity (High/Medium/Low) and remediation advice.

Code:
```
{code}
```
"""

def autofix_prompt(code: str, issue: str) -> str:
    return f"""You are an expert software engineer. Fix the following issue in the code.

Issue to fix: {issue}

Return ONLY the fixed code with no explanation. Keep all other code unchanged.
Format your response as a unified diff patch like:
--- original
+++ fixed
@@ ... @@
- old line
+ new line

Code:
```
{code}
```
"""

def architecture_prompt(files_summary: str) -> str:
    return f"""Analyze this codebase structure and generate a comprehensive architecture summary.

Files and their contents:
{files_summary}

Provide:
1. Overall architecture pattern (MVC, layered, microservices, etc.)
2. Key modules and their responsibilities
3. Data flow between components
4. Technology stack detected
5. Entry points
6. Potential architectural issues

Format as a clear, structured report.
"""

def technical_debt_prompt(code: str, quality_report: str) -> str:
    return f"""Analyze the technical debt in this code.

Quality Report:
{quality_report}

Code:
```
{code}
```

Provide:
1. Technical Debt Score (0-100%, where 100% = completely unmaintainable)
2. Debt breakdown by category:
   - Complexity debt (complex functions, deep nesting)
   - Duplication debt (repeated logic)
   - Documentation debt (missing docs/comments)
   - Test debt (missing tests)
   - Security debt (vulnerabilities)
3. Estimated refactoring effort (hours)
4. Priority fixes (top 3 most impactful changes)
"""

def complexity_refactor_prompt(func_name: str, func_body: str, line_count: int) -> str:
    return f"""This function is {line_count} lines long and too complex.

Function: {func_name}

```python
{func_body}
```

Suggest how to split this into smaller, focused functions:
1. List each suggested sub-function with its name and responsibility
2. Show the refactored version
3. Explain the benefits
"""

def debug_prompt(error: str, code: str = "") -> str:
    context = f"\n\nRelated code:\n```\n{code}\n```" if code else ""
    return f"""A developer got this error:

{error}
{context}

Explain:
1. What caused this error (root cause)
2. Step-by-step fix
3. How to prevent it in future
"""

def semantic_search_prompt(query: str, code_context: str) -> str:
    return f"""Search the following codebase for: "{query}"

Codebase:
{code_context}

Return:
- Exact file and line numbers where this is implemented
- Brief explanation of each match
- Most relevant match first
"""

def bug_fix_agent_prompt(filename: str, issue: str, code_snippet: str, full_code: str) -> str:
    return f"""You are an autonomous bug-fix agent. Fix the issue below and return a unified diff patch.

File: {filename}
Issue: {issue}

Relevant code:
```
{code_snippet}
```

Rules:
- Return ONLY the diff patch, no explanation outside the patch
- Use unified diff format (--- / +++ / @@ / - / +)
- Keep changes minimal — fix only the reported issue
- If the fix requires multiple lines, show all of them

EXPLANATION: <one sentence>
CONFIDENCE: <high|medium|low>
PATCH:
--- {filename}
+++ {filename}
{code_snippet}
"""


def knowledge_graph_summary_prompt(stats: dict) -> str:
    return f"""Summarize this codebase graph in 3 sentences:
- {stats.get('files', 0)} files
- {stats.get('functions', 0)} functions  
- {stats.get('classes', 0)} classes
- {stats.get('modules', 0)} external modules
- {stats.get('total_edges', 0)} relationships

Focus on architecture patterns and key dependencies.
"""


def pr_review_prompt(diff: str, context: str = "") -> str:
    return f"""You are an expert code reviewer. Review this pull request diff.

{f"Context: {context}" if context else ""}

Diff:
```diff
{diff[:5000]}
```

For each changed section provide:
1. LINE: The line number or range
2. SEVERITY: critical | warning | suggestion
3. COMMENT: Specific, actionable feedback

Focus on: bugs, security issues, performance, readability, best practices.
Format each comment as:
LINE <number>: [SEVERITY] <comment>
"""


def autopilot_prompt(issues_summary: str, code: str) -> str:
    return f"""You are an autonomous code improvement agent.

Issues found:
{issues_summary}

Code:
```
{code[:3000]}
```

Generate a prioritized improvement plan:
1. CRITICAL FIXES (must fix): list each with line number and exact fix
2. IMPROVEMENTS (should fix): list each with rationale
3. REFACTORING (nice to have): architectural suggestions

Then provide the IMPROVED CODE with all critical fixes applied.
"""


def architecture_refactor_prompt(architecture_summary: str) -> str:
    return f"""You are a software architect. Analyze this architecture and provide refactoring recommendations.

Current Architecture:
{architecture_summary}

Identify:
1. ARCHITECTURE ISSUES: Anti-patterns, violations of SOLID/DRY/KISS
2. RECOMMENDATIONS: Specific design pattern suggestions (Repository, Service Layer, Factory, etc.)
3. REFACTORING STEPS: Ordered list of concrete steps to improve the architecture
4. EXPECTED BENEFITS: What improves after refactoring

Be specific with class/function names from the codebase.
"""


def learning_mode_prompt(code: str, level: str = "beginner") -> str:
    level_desc = {
        "beginner": "a student learning to code for the first time",
        "intermediate": "a developer with 1-2 years experience",
        "advanced": "an experienced developer wanting deep insights",
    }.get(level, "a student")
    return f"""Explain this code to {level_desc}.

Code:
```
{code[:3000]}
```

Include:
1. WHAT IT DOES: Simple explanation of the overall purpose
2. HOW IT WORKS: Step-by-step walkthrough (use simple language for beginners)
3. KEY CONCEPTS: Programming concepts demonstrated (loops, functions, classes, etc.)
4. COMPLEXITY: Time and space complexity in simple terms
5. IMPROVEMENTS: 2-3 beginner-friendly suggestions to make it better
6. CHALLENGE: One small exercise to practice what was learned

Use analogies and simple language appropriate for the level.
"""


def model_benchmark_prompt(code: str, task: str = "review") -> str:
    return f"""Task: {task}

Code:
```
{code[:2000]}
```

Provide a structured analysis. Be concise and precise.
"""


def semantic_nav_prompt(query: str, code_chunks: str) -> str:
    return f"""Developer search query: "{query}"

Codebase chunks:
{code_chunks[:6000]}

Find and return:
1. BEST MATCH: The most relevant file/function/class with exact location
2. RELATED: 2-3 other relevant locations
3. EXPLANATION: Why each match is relevant to the query
4. USAGE EXAMPLE: How to use/navigate to the found code

Format: FILE: <name> | LINE: <n> | MATCH: <description>
"""
