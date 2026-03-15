from ai_engine.ollama_client import ask_ai
from analyzers.code_parser import parse_code

def generate_tests(code: str, language: str = "python") -> str:
    """Generate unit tests for all functions found in the code."""
    parsed = parse_code(code, language)

    if not parsed.functions:
        # No functions found, generate tests for the whole file
        prompt = f"""Generate comprehensive unit tests for the following code.
Use pytest for Python. Include:
- Happy path tests
- Edge cases
- Error/exception tests

Code:
```{language}
{code}
```
"""
        return ask_ai(prompt)

    # Generate tests per function for better quality
    results = []
    for fn in parsed.functions[:6]:
        prompt = f"""Generate pytest unit tests for this function.
Include: happy path, edge cases, and error cases.
Function name: {fn.name}
Parameters: {', '.join(fn.params) if fn.params else 'none'}

Code:
```python
{fn.body}
```
"""
        test_code = ask_ai(prompt)
        results.append(f"# Tests for {fn.name}()\n{test_code}")

    return "\n\n".join(results)
