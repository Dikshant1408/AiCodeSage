"""
Deep Issue Extractor
====================
Extracts every error/warning from every file with:
- Exact file + line + column
- What the problem is (plain English)
- Why it's a problem
- How to fix it

Works for Python (pylint/bandit/flake8 output) and JS/TS/Java/CSS/HTML (regex patterns).
"""
import re
from dataclasses import dataclass, field
from typing import List, Dict

@dataclass
class DetailedIssue:
    file: str
    line: int
    col: int
    severity: str       # critical | high | medium | low | info
    category: str       # security | bug | style | performance | maintainability
    code: str           # e.g. E501, B101, no-console
    message: str        # plain English description
    fix_hint: str       # exactly how to fix it
    tool: str           # pylint | bandit | flake8 | static | pattern


# ── Pylint output parser ──────────────────────────────────────────────────────

PYLINT_FIXES = {
    "E0001": ("Syntax error — Python cannot parse this file.", "Fix the syntax error shown. Check for missing colons, brackets, or indentation."),
    "E0102": ("Function/class defined twice with the same name.", "Rename one of them or remove the duplicate."),
    "E0401": ("Import failed — module not found.", "Install the missing package: pip install <module_name>"),
    "E0611": ("Cannot import name from module.", "Check the module's API — the name may have changed or been removed."),
    "E1101": ("Module has no such attribute.", "Check the library docs — the attribute may not exist in this version."),
    "E0602": ("Undefined variable used.", "Define the variable before using it, or check for a typo in the name."),
    "E0611": ("Name not found in module.", "Check the import path and module version."),
    "W0611": ("Imported but unused.", "Remove the unused import to keep the code clean."),
    "W0612": ("Variable assigned but never used.", "Remove the assignment or use the variable."),
    "W0613": ("Argument defined but never used in function.", "Remove the parameter or use it in the function body."),
    "W0621": ("Variable name redefines outer scope variable.", "Rename the inner variable to avoid confusion."),
    "W0703": ("Catching too broad exception (Exception).", "Catch specific exceptions like ValueError, TypeError instead."),
    "C0114": ("Missing module docstring.", "Add a docstring at the top: \"\"\"Module description.\"\"\""),
    "C0115": ("Missing class docstring.", "Add a docstring inside the class: \"\"\"Class description.\"\"\""),
    "C0116": ("Missing function docstring.", "Add a docstring: \"\"\"What this function does.\"\"\""),
    "C0301": ("Line too long.", "Break the line into multiple lines or shorten variable names."),
    "C0303": ("Trailing whitespace.", "Remove trailing spaces. Most editors do this automatically on save."),
    "R0201": ("Method could be a function (no self usage).", "Add @staticmethod decorator or move it outside the class."),
    "R0902": ("Too many instance attributes.", "Split the class into smaller classes with single responsibilities."),
    "R0912": ("Too many branches (if/else).", "Extract logic into helper functions to reduce nesting."),
    "R0914": ("Too many local variables.", "Extract parts of the function into smaller helper functions."),
    "R0915": ("Too many statements in function.", "Split the function into smaller, focused functions."),
}

def _parse_pylint(filename: str, pylint_out: str) -> List[DetailedIssue]:
    issues = []
    pattern = re.compile(r':(\d+):(\d+):\s+([EWCR]\d+):\s+(.+)')
    for m in pattern.finditer(pylint_out):
        line, col, code, msg = int(m.group(1)), int(m.group(2)), m.group(3), m.group(4).strip()
        sev = "high" if code.startswith("E") else "medium" if code.startswith("W") else "low"
        cat = "bug" if code.startswith("E") else "maintainability" if code.startswith(("C","R")) else "style"
        known = PYLINT_FIXES.get(code, (msg, "Review the pylint documentation for this code."))
        issues.append(DetailedIssue(
            file=filename, line=line, col=col, severity=sev,
            category=cat, code=code,
            message=known[0],
            fix_hint=known[1],
            tool="pylint",
        ))
    return issues


# ── Bandit output parser ──────────────────────────────────────────────────────

BANDIT_FIXES = {
    "B101": ("assert used — disabled in optimized Python.", "Use proper if/raise instead of assert for runtime checks."),
    "B102": ("exec() used — can execute arbitrary code.", "Remove exec(). If dynamic code is needed, use safer alternatives."),
    "B103": ("Setting permissions too permissive.", "Use 0o644 for files, 0o755 for directories."),
    "B104": ("Binding to all interfaces (0.0.0.0).", "Bind to 127.0.0.1 in development. Use a reverse proxy in production."),
    "B105": ("Hardcoded password string.", "Move to environment variable: os.environ.get('PASSWORD')"),
    "B106": ("Hardcoded password as function argument.", "Pass the password from environment variables, not hardcoded."),
    "B107": ("Hardcoded password as default argument.", "Use None as default and read from env: os.environ.get('PASSWORD')"),
    "B108": ("Probable insecure temp file.", "Use tempfile.mkstemp() or tempfile.NamedTemporaryFile() instead."),
    "B110": ("try/except/pass — silently swallowing exceptions.", "Log the exception or handle it properly. Never use bare pass."),
    "B201": ("Flask app running in debug mode.", "Set debug=False in production. Use environment variable to control."),
    "B301": ("Pickle used — can execute arbitrary code on load.", "Use JSON or another safe serialization format instead."),
    "B303": ("MD5 used — cryptographically weak.", "Use hashlib.sha256() or bcrypt for passwords."),
    "B304": ("Cipher mode without IV — insecure.", "Use AES-GCM or AES-CBC with a random IV."),
    "B307": ("eval() used — executes arbitrary code.", "Remove eval(). Parse data with json.loads() or ast.literal_eval() instead."),
    "B311": ("random used for security — not cryptographically secure.", "Use secrets module: secrets.token_hex() for security-sensitive values."),
    "B320": ("XML parsing vulnerable to XXE.", "Use defusedxml library instead of standard xml.etree."),
    "B324": ("hashlib using MD5/SHA1 — weak for passwords.", "Use bcrypt, argon2, or hashlib.sha256 for non-password hashing."),
    "B501": ("SSL certificate verification disabled.", "Remove verify=False. Always verify SSL certificates in production."),
    "B506": ("YAML load() can execute arbitrary code.", "Use yaml.safe_load() instead of yaml.load()."),
    "B601": ("Shell injection via paramiko.", "Sanitize all user input before passing to shell commands."),
    "B602": ("subprocess with shell=True — command injection risk.", "Use shell=False and pass arguments as a list: subprocess.run(['cmd', 'arg'])"),
    "B603": ("subprocess without shell=True — still check inputs.", "Validate all inputs before passing to subprocess."),
    "B604": ("Function call with shell=True.", "Avoid shell=True. Pass command as list to prevent injection."),
    "B605": ("os.system() used — command injection risk.", "Use subprocess.run(['cmd', 'arg'], shell=False) instead."),
    "B606": ("os.popen() used — command injection risk.", "Use subprocess.run() with shell=False instead."),
    "B607": ("Starting process with partial path.", "Use full absolute path to the executable."),
    "B608": ("SQL query built with string formatting — SQL injection.", "Use parameterized queries: cursor.execute('SELECT * WHERE id=?', (id,))"),
    "B701": ("Jinja2 autoescape disabled — XSS risk.", "Enable autoescape: Environment(autoescape=True)"),
    "B702": ("Mako template used — XSS risk.", "Use Jinja2 with autoescape enabled instead."),
}

def _parse_bandit(filename: str, bandit_out: str) -> List[DetailedIssue]:
    issues = []
    blocks = re.split(r'>> Issue:', bandit_out)
    for block in blocks[1:]:
        lines_b = block.strip().splitlines()
        desc = lines_b[0].strip() if lines_b else ""
        code_m = re.search(r'\[([BH]\d+)', desc)
        code = code_m.group(1) if code_m else "B000"
        loc_m = re.search(r'Location:.*?:(\d+)', block)
        line = int(loc_m.group(1)) if loc_m else 0
        sev_m = re.search(r'Severity:\s+(\w+)', block)
        sev_raw = sev_m.group(1).lower() if sev_m else "medium"
        sev = "critical" if sev_raw == "high" else "high" if sev_raw == "medium" else "medium"
        known = BANDIT_FIXES.get(code, (desc[:100], "Review the bandit documentation for this issue."))
        issues.append(DetailedIssue(
            file=filename, line=line, col=0, severity=sev,
            category="security", code=code,
            message=known[0],
            fix_hint=known[1],
            tool="bandit",
        ))
    return issues


# ── Flake8 output parser ──────────────────────────────────────────────────────

FLAKE8_FIXES = {
    "E101": ("Indentation contains mixed spaces and tabs.", "Use only spaces (4 per level). Configure your editor to convert tabs to spaces."),
    "E111": ("Indentation is not a multiple of 4.", "Use exactly 4 spaces per indentation level."),
    "E121": ("Continuation line under-indented.", "Align continuation lines with the opening delimiter."),
    "E128": ("Continuation line under-indented for visual indent.", "Align with the opening parenthesis."),
    "E201": ("Whitespace after '('.", "Remove the space: func(arg) not func( arg)"),
    "E225": ("Missing whitespace around operator.", "Add spaces: x = 1 + 2 not x=1+2"),
    "E231": ("Missing whitespace after ','.", "Add space after comma: func(a, b) not func(a,b)"),
    "E251": ("Unexpected spaces around keyword / parameter equals.", "Remove spaces: def f(x=1) not def f(x = 1)"),
    "E261": ("At least two spaces before inline comment.", "Add two spaces before #: code  # comment"),
    "E302": ("Expected 2 blank lines before function/class.", "Add two blank lines before top-level functions and classes."),
    "E303": ("Too many blank lines.", "Use at most 2 blank lines between top-level definitions."),
    "E401": ("Multiple imports on one line.", "Put each import on its own line: import os\\nimport sys"),
    "E501": ("Line too long.", "Break into multiple lines. Max 79 chars (PEP8) or 120 chars (common)."),
    "E711": ("Comparison to None using == instead of is.", "Use: if x is None not if x == None"),
    "E712": ("Comparison to True/False using == instead of is.", "Use: if x is True or just if x"),
    "F401": ("Imported but unused.", "Remove the unused import."),
    "F811": ("Redefinition of unused name.", "Remove the first definition or rename one of them."),
    "F821": ("Undefined name.", "Define the variable/function before using it."),
    "W291": ("Trailing whitespace.", "Remove trailing spaces. Enable 'trim trailing whitespace' in your editor."),
    "W292": ("No newline at end of file.", "Add a newline at the end of the file."),
    "W293": ("Whitespace before a blank line.", "Remove spaces from blank lines."),
    "W391": ("Blank line at end of file.", "Remove the trailing blank line."),
    "W503": ("Line break before binary operator.", "Move the operator to the end of the previous line."),
}

def _parse_flake8(filename: str, flake8_out: str) -> List[DetailedIssue]:
    issues = []
    pattern = re.compile(r':(\d+):(\d+):\s+([EWF]\d+)\s+(.+)')
    for m in pattern.finditer(flake8_out):
        line, col, code, msg = int(m.group(1)), int(m.group(2)), m.group(3), m.group(4).strip()
        sev = "medium" if code.startswith(("E1","E2","E3","E4","E5","E7")) else "low"
        known = FLAKE8_FIXES.get(code, (msg, "Fix the style issue to follow PEP8 conventions."))
        issues.append(DetailedIssue(
            file=filename, line=line, col=col, severity=sev,
            category="style", code=code,
            message=known[0],
            fix_hint=known[1],
            tool="flake8",
        ))
    return issues


# ── JS/TS pattern-based issues ────────────────────────────────────────────────

JS_PATTERNS = [
    (r'\bconsole\.(log|warn|error)\s*\(',  "low",    "style",        "no-console",    "console.log left in code",                    "Remove console.log before production. Use a proper logger like winston or pino."),
    (r'\beval\s*\(',                        "critical","security",    "no-eval",       "eval() executes arbitrary code — XSS risk",   "Remove eval(). Use JSON.parse() for JSON, or restructure the logic."),
    (r':\s*any\b',                          "medium",  "maintainability","no-any",     "TypeScript 'any' type disables type checking","Replace 'any' with a specific type or interface. Use 'unknown' if type is truly unknown."),
    (r'\.catch\s*\(\s*\)',                  "high",    "bug",          "empty-catch",  "Empty .catch() silently swallows errors",     "Add error handling: .catch(err => console.error(err)) or log and rethrow."),
    (r'(?:password|secret|api_?key)\s*=\s*["\'][^"\']{4,}', "critical","security","hardcoded-secret","Hardcoded secret/password in source code","Move to environment variable: process.env.API_KEY. Never commit secrets."),
    (r'\bdocument\.write\s*\(',             "high",    "security",     "no-document-write","document.write() can cause XSS",          "Use DOM manipulation: document.getElementById().textContent = value"),
    (r'innerHTML\s*=\s*(?!`[^`]*`)',        "high",    "security",     "no-inner-html","innerHTML with dynamic content — XSS risk",  "Use textContent for text, or sanitize HTML with DOMPurify before setting innerHTML."),
    (r'var\s+\w+',                          "low",     "style",        "no-var",       "var has function scope — use let/const",      "Replace var with const (if not reassigned) or let (if reassigned)."),
    (r'==\s*(?!null|undefined)',            "low",     "bug",          "eqeqeq",       "== does type coercion — use === instead",     "Replace == with === for strict equality comparison."),
    (r'TODO|FIXME|HACK',                    "low",     "maintainability","todo",       "Unresolved TODO/FIXME comment",               "Resolve the TODO or create a ticket to track it."),
]

def _extract_js_issues(filename: str, code: str) -> List[DetailedIssue]:
    issues = []
    lines = code.splitlines()
    for pattern, sev, cat, code_id, msg, fix in JS_PATTERNS:
        for m in re.finditer(pattern, code, re.IGNORECASE):
            line = code[:m.start()].count("\n") + 1
            col  = m.start() - code.rfind("\n", 0, m.start())
            issues.append(DetailedIssue(
                file=filename, line=line, col=col, severity=sev,
                category=cat, code=code_id,
                message=msg,
                fix_hint=fix,
                tool="static",
            ))
    return issues


# ── Java pattern-based issues ─────────────────────────────────────────────────

JAVA_PATTERNS = [
    (r'System\.out\.print',                 "low",    "style",        "no-sysout",     "System.out.print used instead of logger",     "Use a logging framework: Logger.info() or SLF4J."),
    (r'catch\s*\([^)]+\)\s*\{\s*\}',       "high",   "bug",          "empty-catch",   "Empty catch block silently swallows exception","Log the exception: logger.error('Error', e) or rethrow it."),
    (r'(?:password|secret)\s*=\s*"[^"]{4,}"',"critical","security",  "hardcoded-secret","Hardcoded password in source code",          "Use environment variables or a secrets manager."),
    (r'\.printStackTrace\(\)',              "medium", "maintainability","stack-trace",  "printStackTrace() used instead of logger",    "Use logger.error('message', e) instead."),
    (r'TODO|FIXME',                         "low",    "maintainability","todo",         "Unresolved TODO/FIXME",                       "Resolve or create a ticket."),
]

def _extract_java_issues(filename: str, code: str) -> List[DetailedIssue]:
    issues = []
    for pattern, sev, cat, code_id, msg, fix in JAVA_PATTERNS:
        for m in re.finditer(pattern, code, re.IGNORECASE):
            line = code[:m.start()].count("\n") + 1
            issues.append(DetailedIssue(
                file=filename, line=line, col=0, severity=sev,
                category=cat, code=code_id,
                message=msg, fix_hint=fix, tool="static",
            ))
    return issues


# ── CSS pattern-based issues ──────────────────────────────────────────────────

CSS_PATTERNS = [
    (r'!important',  "medium", "style",  "no-important", "!important overrides cascade — hard to maintain", "Increase specificity instead of using !important."),
    (r'color:\s*#[0-9a-fA-F]{3,6}(?!.*var\()', "low", "maintainability", "hardcoded-color", "Hardcoded color value", "Use CSS variables: --primary-color: #value; then var(--primary-color)"),
]

def _extract_css_issues(filename: str, code: str) -> List[DetailedIssue]:
    issues = []
    for pattern, sev, cat, code_id, msg, fix in CSS_PATTERNS:
        for m in re.finditer(pattern, code):
            line = code[:m.start()].count("\n") + 1
            issues.append(DetailedIssue(
                file=filename, line=line, col=0, severity=sev,
                category=cat, code=code_id,
                message=msg, fix_hint=fix, tool="static",
            ))
    return issues[:20]


# ── HTML pattern-based issues ─────────────────────────────────────────────────

HTML_PATTERNS = [
    (r'<img(?![^>]*\balt\s*=)',  "medium", "style",    "img-alt",    "Image missing alt attribute — accessibility issue", "Add alt text: <img src='...' alt='Description of image'>"),
    (r'<script[^>]*>[^<]',       "medium", "style",    "inline-js",  "Inline JavaScript in HTML",                         "Move to external .js file and use <script src='file.js'>"),
    (r'style\s*=\s*"',           "low",    "style",    "inline-css", "Inline CSS style attribute",                        "Move styles to a CSS class and use className/class attribute."),
    (r'onclick\s*=',             "medium", "style",    "inline-event","Inline event handler",                              "Use addEventListener() in JavaScript instead."),
    (r'<form(?![^>]*action)',    "medium", "bug",      "form-action", "Form missing action attribute",                     "Add action attribute: <form action='/submit' method='post'>"),
]

def _extract_html_issues(filename: str, code: str) -> List[DetailedIssue]:
    issues = []
    for pattern, sev, cat, code_id, msg, fix in HTML_PATTERNS:
        for m in re.finditer(pattern, code, re.IGNORECASE):
            line = code[:m.start()].count("\n") + 1
            issues.append(DetailedIssue(
                file=filename, line=line, col=0, severity=sev,
                category=cat, code=code_id,
                message=msg, fix_hint=fix, tool="static",
            ))
    return issues[:20]


# ── Main entry point ──────────────────────────────────────────────────────────

def extract_issues(filename: str, code: str,
                   pylint_out: str = "", bandit_out: str = "",
                   flake8_out: str = "") -> List[DetailedIssue]:
    """Extract all detailed issues from a file."""
    issues = []

    if filename.endswith(".py"):
        if pylint_out:
            issues.extend(_parse_pylint(filename, pylint_out))
        if bandit_out:
            issues.extend(_parse_bandit(filename, bandit_out))
        if flake8_out:
            issues.extend(_parse_flake8(filename, flake8_out))

    elif filename.endswith((".js", ".jsx", ".ts", ".tsx")):
        issues.extend(_extract_js_issues(filename, code))

    elif filename.endswith(".java"):
        issues.extend(_extract_java_issues(filename, code))

    elif filename.endswith((".css", ".scss")):
        issues.extend(_extract_css_issues(filename, code))

    elif filename.endswith((".html", ".htm")):
        issues.extend(_extract_html_issues(filename, code))

    # Deduplicate by (line, code)
    seen = set()
    unique = []
    for issue in issues:
        key = (issue.line, issue.code)
        if key not in seen:
            seen.add(key)
            unique.append(issue)

    return unique
