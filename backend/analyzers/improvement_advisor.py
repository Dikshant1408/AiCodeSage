"""
Improvement Advisor
====================
Generates prioritized, actionable improvement recommendations
based on all static analysis results across the entire repository.

No AI. Pure logic. Each recommendation includes:
- What the problem is
- Why it matters
- Exactly how to fix it
- Which files are affected
- Estimated effort
- Expected impact
"""
from dataclasses import dataclass, field
from typing import Dict, List, Any

@dataclass
class Improvement:
    priority: int           # 1 = highest
    category: str           # security | performance | maintainability | reliability | architecture
    title: str
    description: str        # what the problem is
    why_it_matters: str     # why this is important
    how_to_fix: str         # step-by-step fix
    affected_files: List[str] = field(default_factory=list)
    affected_lines: List[str] = field(default_factory=list)  # ["file.py:42", ...]
    effort: str = "medium"  # low | medium | high
    impact: str = "medium"  # low | medium | high | critical


def generate_improvements(
    files: Dict[str, str],
    all_issues: Dict[str, list],
    complexity_hotspots: List[Dict],
    duplicate_clusters: List[Dict],
    dead_functions: List[Dict],
    coupling_map: List[Dict],
    cross_file_taint: List[Dict],
) -> List[Improvement]:
    improvements = []
    p = 1  # priority counter

    # ── 1. Security: cross-file taint paths ──────────────────────────────────
    if cross_file_taint:
        critical = [t for t in cross_file_taint if t["severity"] == "critical"]
        if critical:
            affected = list({t["source_file"] for t in critical} | {t["sink_file"] for t in critical})
            paths_desc = "\n".join(
                f"  • {t['source_file']}:{t['source_line']} → {t['sink_file']}:{t['sink_line']} ({t['risk']})"
                for t in critical[:5]
            )
            improvements.append(Improvement(
                priority=p, category="security",
                title=f"Fix {len(critical)} SQL/Command Injection vulnerability path{'s' if len(critical)>1 else ''}",
                description=f"User-controlled input flows into dangerous function calls across file boundaries:\n{paths_desc}",
                why_it_matters="These are exploitable vulnerabilities. An attacker can extract your entire database, execute system commands, or take over the server.",
                how_to_fix="1. Never concatenate user input into SQL queries.\n2. Use parameterized queries: cursor.execute('SELECT * WHERE id=?', (user_id,))\n3. For shell commands: use subprocess.run(['cmd', arg], shell=False)\n4. Validate and sanitize all user input at the entry point.",
                affected_files=affected,
                affected_lines=[f"{t['source_file']}:{t['source_line']}" for t in critical[:5]],
                effort="medium", impact="critical",
            ))
            p += 1

    # ── 2. Security: hardcoded secrets ────────────────────────────────────────
    secret_issues = []
    for fn, issues in all_issues.items():
        for issue in issues:
            if issue.code in ("hardcoded-secret", "B105", "B106", "B107") or "hardcoded" in issue.message.lower():
                secret_issues.append(f"{fn}:{issue.line}")
    if secret_issues:
        improvements.append(Improvement(
            priority=p, category="security",
            title=f"Remove {len(secret_issues)} hardcoded secret{'s' if len(secret_issues)>1 else ''}",
            description=f"Passwords, API keys, or secrets are hardcoded in source files:\n" + "\n".join(f"  • {s}" for s in secret_issues[:5]),
            why_it_matters="Anyone with access to your repository (or git history) can steal these credentials. This is one of the most common causes of data breaches.",
            how_to_fix="1. Remove the hardcoded value immediately.\n2. Create a .env file: API_KEY=your_value_here\n3. Add .env to .gitignore\n4. Read in code: os.environ.get('API_KEY') or process.env.API_KEY\n5. Rotate the exposed credentials — assume they are compromised.",
            affected_files=list({s.split(":")[0] for s in secret_issues}),
            affected_lines=secret_issues[:10],
            effort="low", impact="critical",
        ))
        p += 1

    # ── 3. Security: eval/exec usage ─────────────────────────────────────────
    eval_issues = [f"{fn}:{i.line}" for fn, issues in all_issues.items()
                   for i in issues if i.code in ("no-eval", "B307", "B102")]
    if eval_issues:
        improvements.append(Improvement(
            priority=p, category="security",
            title=f"Remove {len(eval_issues)} eval()/exec() call{'s' if len(eval_issues)>1 else ''}",
            description=f"eval() or exec() found at:\n" + "\n".join(f"  • {e}" for e in eval_issues[:5]),
            why_it_matters="eval() executes any string as code. If user input reaches eval(), attackers can run arbitrary code on your server.",
            how_to_fix="Python: Use ast.literal_eval() for safe evaluation of literals, or json.loads() for JSON.\nJavaScript: Use JSON.parse() for JSON data. Restructure logic to avoid dynamic code execution.",
            affected_files=list({e.split(":")[0] for e in eval_issues}),
            affected_lines=eval_issues,
            effort="medium", impact="critical",
        ))
        p += 1

    # ── 4. Reliability: empty catch blocks ───────────────────────────────────
    empty_catch = [f"{fn}:{i.line}" for fn, issues in all_issues.items()
                   for i in issues if i.code in ("empty-catch", "B110")]
    if empty_catch:
        improvements.append(Improvement(
            priority=p, category="reliability",
            title=f"Fix {len(empty_catch)} empty catch block{'s' if len(empty_catch)>1 else ''}",
            description=f"Exceptions are being silently swallowed at:\n" + "\n".join(f"  • {e}" for e in empty_catch[:5]),
            why_it_matters="Silent failures are the hardest bugs to debug. When something goes wrong, you'll have no idea why — no logs, no errors, nothing.",
            how_to_fix="At minimum, log the error:\n  Python: except Exception as e: logger.error(f'Failed: {e}')\n  JavaScript: .catch(err => console.error('Failed:', err))\nBetter: handle the specific exception type and recover gracefully.",
            affected_files=list({e.split(":")[0] for e in empty_catch}),
            affected_lines=empty_catch,
            effort="low", impact="high",
        ))
        p += 1

    # ── 5. Performance: complexity hotspots ──────────────────────────────────
    critical_complexity = [h for h in complexity_hotspots if h["risk"] in ("critical", "high")]
    if critical_complexity:
        affected = list({h["file"] for h in critical_complexity})
        desc = "\n".join(f"  • {h['function']}() in {h['file']}:{h['line']} — complexity {h['complexity']}, {h['loc']} lines"
                         for h in critical_complexity[:5])
        improvements.append(Improvement(
            priority=p, category="maintainability",
            title=f"Refactor {len(critical_complexity)} overly complex function{'s' if len(critical_complexity)>1 else ''}",
            description=f"These functions have too many branches and are hard to test and maintain:\n{desc}",
            why_it_matters="High cyclomatic complexity means more possible execution paths, more bugs, and harder testing. Functions with complexity > 10 are statistically more likely to contain bugs.",
            how_to_fix="1. Extract logical blocks into named helper functions.\n2. Replace complex if/else chains with early returns.\n3. Use dictionaries/maps instead of long if/elif chains.\n4. Each function should do ONE thing. If you can't describe it in one sentence, split it.",
            affected_files=affected,
            affected_lines=[f"{h['file']}:{h['line']}" for h in critical_complexity[:5]],
            effort="high", impact="medium",
        ))
        p += 1

    # ── 6. Maintainability: cross-file duplicates ─────────────────────────────
    cross_file_dups = [c for c in duplicate_clusters if c.get("cross_file")]
    if cross_file_dups:
        affected = list({f["file"] for c in cross_file_dups for f in c["functions"]})
        desc = "\n".join(
            f"  • {c['functions'][0]['function']}() duplicated in: " +
            ", ".join(f"{f['file']}:{f['line']}" for f in c["functions"])
            for c in cross_file_dups[:3]
        )
        improvements.append(Improvement(
            priority=p, category="maintainability",
            title=f"Eliminate {len(cross_file_dups)} cross-file duplicate function cluster{'s' if len(cross_file_dups)>1 else ''}",
            description=f"Same logic exists in multiple files:\n{desc}",
            why_it_matters="When you fix a bug in one copy, you forget to fix it in the others. This is how bugs survive for years.",
            how_to_fix="1. Create a shared utility file (utils.py, helpers.js, common.ts).\n2. Move the function there.\n3. Import and use it from all the places that had the duplicate.\n4. Delete the duplicates.",
            affected_files=affected,
            affected_lines=[f"{f['file']}:{f['line']}" for c in cross_file_dups[:3] for f in c["functions"]],
            effort="medium", impact="medium",
        ))
        p += 1

    # ── 7. Architecture: high coupling ───────────────────────────────────────
    high_coupling = [c for c in coupling_map if c["risk"] == "high"]
    if high_coupling:
        desc = "\n".join(f"  • {c['file']} — imported by {c['imported_by']} files, imports {c['imports_count']} modules"
                         for c in high_coupling[:3])
        improvements.append(Improvement(
            priority=p, category="architecture",
            title=f"{len(high_coupling)} highly coupled file{'s' if len(high_coupling)>1 else ''} — risky to change",
            description=f"These files are imported by many others. Changing them breaks many things:\n{desc}",
            why_it_matters="High coupling means a small change in one file can break many others. This slows down development and makes refactoring dangerous.",
            how_to_fix="1. Identify what these files export and why so many files need them.\n2. Split large utility files into focused modules (auth.py, db.py, validators.py).\n3. Use dependency injection instead of direct imports where possible.\n4. Consider creating an interface/abstract class that multiple implementations can satisfy.",
            affected_files=[c["file"] for c in high_coupling],
            effort="high", impact="medium",
        ))
        p += 1

    # ── 8. Maintainability: dead code ─────────────────────────────────────────
    if dead_functions:
        desc = "\n".join(f"  • {d['function']}() in {d['file']}:{d['line']}" for d in dead_functions[:5])
        improvements.append(Improvement(
            priority=p, category="maintainability",
            title=f"Remove {len(dead_functions)} dead function{'s' if len(dead_functions)>1 else ''} never called anywhere",
            description=f"These functions are defined but never called in the repository:\n{desc}",
            why_it_matters="Dead code confuses developers, increases maintenance burden, and can hide security vulnerabilities that nobody knows are there.",
            how_to_fix="1. Verify the function is truly unused (check for dynamic calls, reflection, or external callers).\n2. If confirmed unused, delete it.\n3. If it might be needed later, add a comment explaining why it's kept.",
            affected_files=list({d["file"] for d in dead_functions}),
            affected_lines=[f"{d['file']}:{d['line']}" for d in dead_functions[:10]],
            effort="low", impact="low",
        ))
        p += 1

    # ── 9. Style: console.log / debug statements ──────────────────────────────
    debug_issues = [f"{fn}:{i.line}" for fn, issues in all_issues.items()
                    for i in issues if i.code in ("no-console", "no-sysout")]
    if len(debug_issues) > 3:
        improvements.append(Improvement(
            priority=p, category="maintainability",
            title=f"Remove {len(debug_issues)} debug logging statements before production",
            description=f"console.log/System.out.print found in {len({e.split(':')[0] for e in debug_issues})} files.",
            why_it_matters="Debug logs slow down production, expose internal data to users, and clutter monitoring systems.",
            how_to_fix="JavaScript: Use a proper logger (winston, pino) with log levels. Set level to 'error' in production.\nPython: Use the logging module: logging.debug() instead of print().\nJava: Use SLF4J or Log4j with appropriate log levels.",
            affected_files=list({e.split(":")[0] for e in debug_issues}),
            affected_lines=debug_issues[:10],
            effort="low", impact="medium",
        ))
        p += 1

    # ── 10. TypeScript: any types ─────────────────────────────────────────────
    any_issues = [f"{fn}:{i.line}" for fn, issues in all_issues.items()
                  for i in issues if i.code == "no-any"]
    if any_issues:
        improvements.append(Improvement(
            priority=p, category="maintainability",
            title=f"Replace {len(any_issues)} TypeScript 'any' type{'s' if len(any_issues)>1 else ''} with proper types",
            description=f"'any' type found in {len({e.split(':')[0] for e in any_issues})} files — defeats the purpose of TypeScript.",
            why_it_matters="Using 'any' disables TypeScript's type checking for that variable. You lose all the benefits of TypeScript and introduce potential runtime errors.",
            how_to_fix="1. Use 'unknown' instead of 'any' when the type is truly unknown — it forces you to check the type before using it.\n2. Create proper interfaces/types for your data structures.\n3. Use generics for reusable functions: function process<T>(data: T): T\n4. Enable strict mode in tsconfig.json to catch these automatically.",
            affected_files=list({e.split(":")[0] for e in any_issues}),
            affected_lines=any_issues[:10],
            effort="medium", impact="medium",
        ))
        p += 1

    # ── 11. Future improvements (always included) ─────────────────────────────
    has_tests = any("test" in fn.lower() or "spec" in fn.lower() for fn in files)
    if not has_tests:
        improvements.append(Improvement(
            priority=p, category="reliability",
            title="No test files detected — add automated tests",
            description="The repository has no test files (no test_*.py, *.spec.js, *.test.ts, etc.).",
            why_it_matters="Without tests, every change is a gamble. You can't refactor safely, you can't catch regressions, and you can't deploy with confidence.",
            how_to_fix="Python: Use pytest. Create test_<module>.py files.\nJavaScript/TypeScript: Use Jest or Vitest. Create *.test.ts files.\nStart with the most critical functions — authentication, data processing, API endpoints.\nAim for 70%+ coverage on business logic.",
            affected_files=[],
            effort="high", impact="high",
        ))
        p += 1

    has_env_example = any(".env" in fn for fn in files)
    if not has_env_example:
        improvements.append(Improvement(
            priority=p, category="architecture",
            title="Add .env.example file for environment configuration",
            description="No .env.example file found. New developers won't know what environment variables are needed.",
            why_it_matters="Without documentation of required env vars, onboarding new developers is painful and deployments fail mysteriously.",
            how_to_fix="1. Create .env.example with all required variables (no real values):\n   DATABASE_URL=postgresql://user:pass@localhost/dbname\n   API_KEY=your_api_key_here\n2. Add .env to .gitignore\n3. Document each variable with a comment explaining what it's for.",
            affected_files=[],
            effort="low", impact="medium",
        ))
        p += 1

    return sorted(improvements, key=lambda x: x.priority)
