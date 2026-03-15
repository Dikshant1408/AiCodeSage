#!/usr/bin/env python3
"""
AI Code Assistant CLI
Usage: python cli.py scan ./myproject
       python cli.py review myfile.py
       python cli.py debug "TypeError: NoneType..."
"""
import sys
import os
import json
import argparse

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

def _print_header(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")

def cmd_review(args):
    from analyzers.pipeline import run_pipeline
    from dataclasses import asdict
    with open(args.file, 'r') as f:
        code = f.read()
    _print_header(f"AI Code Review: {args.file}")
    result = run_pipeline(code, analyze_functions=False)
    q = result.quality
    print(f"\n  Quality Score : {q.score}/10  [{q.grade}]")
    print(f"  Bugs          : {q.bugs}")
    print(f"  Security      : {q.security_issues}")
    print(f"  Code Smells   : {q.code_smells}")
    print(f"  Complexity    : {q.complexity}")
    print(f"\n  Functions     : {', '.join(result.functions_found) or 'none'}")
    print(f"  Classes       : {', '.join(result.classes_found) or 'none'}")
    if q.issues:
        print("\n  Issues:")
        for issue in q.issues:
            print(f"    ▸ {issue}")
    print(f"\n  AI Review:\n{result.ai_review[:1000]}")

def cmd_scan(args):
    from analyzers.pipeline import run_pipeline
    from analyzers.duplicate_detector import detect_duplicates
    from dataclasses import asdict

    SUPPORTED = (".py", ".js", ".ts", ".jsx", ".tsx")
    path = args.path
    files = {}

    if os.path.isfile(path):
        files[path] = open(path).read()
    else:
        for root, dirs, filenames in os.walk(path):
            dirs[:] = [d for d in dirs if d not in ('node_modules', '__pycache__', 'venv', '.git')]
            for fname in filenames:
                if fname.endswith(SUPPORTED):
                    full = os.path.join(root, fname)
                    try:
                        files[os.path.relpath(full, path)] = open(full).read()
                    except Exception:
                        pass

    _print_header(f"Project Scan: {path}")
    print(f"  Files found: {len(files)}")

    scores = []
    total_bugs = 0
    total_security = 0

    for filename, code in list(files.items())[:20]:
        try:
            result = run_pipeline(code, analyze_functions=False)
            q = result.quality
            scores.append(q.score)
            total_bugs += q.bugs
            total_security += q.security_issues
            grade_color = q.grade
            print(f"\n  {filename}")
            print(f"    Score: {q.score}/10 [{grade_color}]  Bugs: {q.bugs}  Security: {q.security_issues}  Smells: {q.code_smells}")
        except Exception as e:
            print(f"\n  {filename}  ERROR: {e}")

    if scores:
        avg = round(sum(scores) / len(scores), 1)
        print(f"\n{'─'*60}")
        print(f"  Average Quality Score : {avg}/10")
        print(f"  Total Bugs            : {total_bugs}")
        print(f"  Total Security Issues : {total_security}")
        print(f"  Files Analyzed        : {len(scores)}")

def cmd_bugs(args):
    from ai_engine.groq_client import ask_ai
    from ai_engine.prompts import bug_detection_prompt
    from analyzers.static_analyzer import run_pylint
    with open(args.file, 'r') as f:
        code = f.read()
    _print_header(f"Bug Detection: {args.file}")
    print("\n  Running AI analysis...")
    bugs = ask_ai(bug_detection_prompt(code))
    print(f"\n{bugs}")
    print("\n  Static Analysis (pylint):")
    print(run_pylint(code)[:500])

def cmd_security(args):
    from ai_engine.groq_client import ask_ai
    from ai_engine.prompts import security_prompt
    from analyzers.static_analyzer import run_bandit
    with open(args.file, 'r') as f:
        code = f.read()
    _print_header(f"Security Scan: {args.file}")
    print(ask_ai(security_prompt(code)))
    print("\n  Bandit Scan:")
    print(run_bandit(code)[:500])

def cmd_debug(args):
    from ai_engine.groq_client import ask_ai
    from ai_engine.prompts import debug_prompt
    _print_header("AI Debugger")
    code = open(args.file).read() if args.file else ""
    print(ask_ai(debug_prompt(args.error, code)))

def main():
    parser = argparse.ArgumentParser(
        prog="ai-code-assistant",
        description="AI-powered code analysis CLI"
    )
    sub = parser.add_subparsers(dest="command")

    p_review = sub.add_parser("review", help="Review a single file")
    p_review.add_argument("file")

    p_scan = sub.add_parser("scan", help="Scan a project directory or file")
    p_scan.add_argument("path")

    p_bugs = sub.add_parser("bugs", help="Detect bugs in a file")
    p_bugs.add_argument("file")

    p_sec = sub.add_parser("security", help="Security scan a file")
    p_sec.add_argument("file")

    p_debug = sub.add_parser("debug", help="Debug an error message")
    p_debug.add_argument("error", help="Error message to debug")
    p_debug.add_argument("--file", default="", help="Related source file (optional)")

    args = parser.parse_args()
    if not args.command:
        parser.print_help()
        return

    dispatch = {
        "review": cmd_review,
        "scan": cmd_scan,
        "bugs": cmd_bugs,
        "security": cmd_security,
        "debug": cmd_debug,
    }
    dispatch[args.command](args)

if __name__ == "__main__":
    main()
