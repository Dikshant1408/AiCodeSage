from analyzers.repo_intelligence import analyze_repository

files = {
    "app.py": "from flask import request\nimport os\n\ndef login():\n    uid = request.args.get('id')\n    pw = 'hardcoded123'\n    os.system(uid)\n    return uid\n",
    "utils.js": "const x = 1;\nconsole.log(x);\nconst secret = 'abc123';\neval(x);\n// TODO: fix this\n",
}

r = analyze_repository(files)
print("detailed_issues:", len(r.detailed_issues))
print("improvements:", len(r.improvements))
if r.detailed_issues:
    for issue in r.detailed_issues[:5]:
        print(f"  [{issue['severity']}] {issue['file']}:{issue['line']} [{issue['code']}] {issue['message'][:60]}")
        print(f"    FIX: {issue['fix_hint'][:80]}")
if r.improvements:
    for imp in r.improvements[:3]:
        print(f"\nIMPROVEMENT #{imp['priority']}: {imp['title']}")
        print(f"  Impact: {imp['impact']} | Effort: {imp['effort']}")
        print(f"  Files: {imp['affected_files']}")
        print(f"  How to fix:\n{imp['how_to_fix'][:200]}")
