# AI Code Assistant

> **MCA Final Year Project** — AI-powered software engineering platform.
> Combines static analysis, multi-language engines, control flow analysis, autonomous bug-fixing, supply chain security scanning, and a locally-running LLM (DeepSeek Coder via Ollama) into a full-stack developer tool comparable to **SonarQube + GitHub Copilot + Snyk** — with zero API costs.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Recharts, D3.js, Three.js, Monaco Editor |
| Backend | FastAPI, Python 3.10+, SQLite |
| AI Engine | Ollama + DeepSeek Coder (local, free) |
| Static Analysis | pylint, bandit, flake8, Python AST |
| Vulnerability DB | OSV API (open source, no key needed) |
| RAG | ChromaDB + sentence-transformers |
| VS Code Extension | TypeScript, VS Code Extension API |

---

## Features

### Core

| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/` | ZIP upload, quality history chart, feature overview |
| Code Review | `/review` | Per-function AI review + A–F quality score gauge |
| Bug Detection | `/bugs` | Logical errors, crashes, off-by-one, runtime issues |
| Explain Code | `/explain` | Step-by-step breakdown + time/space complexity |
| Security Scan | `/security` | SQL injection, hardcoded secrets, unsafe eval, OWASP |
| Docs Generator | `/docs` | Docstrings, README sections, API documentation |
| Test Generator | `/tests` | pytest unit tests — happy path, edge cases, errors |
| GitHub Analyzer | `/github` | Clone any public repo + RAG-powered codebase chat |

### Advanced

| Feature | Route | Description |
|---------|-------|-------------|
| Control Flow | `/control-flow` | Branch paths, cyclomatic complexity, taint tracking, loop risks |
| Duplicates | `/duplicates` | Token-based Jaccard similarity — finds near-duplicate functions |
| Auto-Fix | `/autofix` | Describe issue → AI generates unified diff patch |
| Tech Debt | `/debt` | Debt score, categorized reasons, estimated refactor effort |
| Debugger | `/debug` | Paste any error traceback → AI explains root cause + fix |
| Architecture | `/architecture` | AI maps modules, services, and dependencies across files |
| Bug-Fix Agent | `/bug-fix-agent` | Autonomous: scan → static analysis → AI patch per issue |
| Code Graph | `/knowledge-graph` | Interactive D3 force graph — files, functions, classes, call chains |

### Intelligence

| Feature | Route | Description |
|---------|-------|-------------|
| Multi-Language | `/polyglot` | Python · JS · TS · Java engines + confidence-scored findings |
| PR Review | `/pr-review` | Paste git diff → AI inline comments per line (like GitHub Copilot) |
| Autopilot | `/autopilot` | Multi-step agent: scan → prioritize → generate improvement plans |
| Analytics | `/analytics` | Recharts quality score trends, bug density, security history (SQLite) |
| Dependencies | `/dependencies` | Scan requirements.txt / package.json for CVEs via OSV database |
| Learning Mode | `/learning` | Beginner / Intermediate / Advanced explanations with exercises |
| Benchmark | `/benchmark` | Compare multiple Ollama models — response time, quality, length |
| Performance | `/performance` | Detect O(n²) loops, N+1 queries, expensive recursion + AI analysis |
| Export Report | `/report` | Full AI analysis report — download as Markdown or PDF |

### VS Code Extension

Right-click any code → **AI Code Assistant** submenu:

| Command | Shortcut | Description |
|---------|----------|-------------|
| Review Code | `Ctrl+Shift+R` | Full review + quality score in sidebar |
| Detect Bugs | `Ctrl+Shift+B` | Bug detection on selection or full file |
| Explain Code | `Ctrl+Shift+E` | Step-by-step explanation |
| Security Scan | `Ctrl+Shift+S` | Security vulnerability scan |
| Generate Tests | — | pytest unit test generation |
| Generate Docs | — | Docstring + README generation |
| Auto-Fix Issue | — | Input issue description → AI diff patch |
| Debug Error | — | Paste traceback → AI explains + fixes |
| Open Dashboard | — | Opens web dashboard in browser |

---

## Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- [Ollama](https://ollama.ai) installed and running

### 1. Pull the AI model
```bash
ollama pull deepseek-coder
```

### 2. Backend
```bash
cd ai-code-assistant/backend
pip install -r requirements.txt
uvicorn main:app --reload
```
Runs at **http://localhost:8000** — interactive docs at **http://localhost:8000/docs**

### 3. Frontend
```bash
cd ai-code-assistant/frontend
npm install
npm run dev
```
Runs at **http://localhost:3001**

### 4. VS Code Extension (optional)
```bash
cd ai-code-assistant/vscode-extension
npm install
npm run compile
# Press F5 in VS Code → Extension Development Host opens
```

---

## API Reference

### Core
```
POST /api/review/          — Code review + quality score
POST /api/analyze/bugs     — Bug detection
POST /api/explain/         — Code explanation
POST /api/security/        — Security scan
POST /api/docs/            — Documentation generation
POST /api/tests/           — Test generation
POST /api/analyze/upload   — ZIP project upload
POST /api/github/          — GitHub repo clone + analysis
POST /api/analyze/chat     — RAG chat with codebase
```

### Advanced
```
POST /api/advanced/control-flow        — Control flow + taint analysis
POST /api/advanced/duplicates          — Duplicate code detection
POST /api/advanced/autofix             — AI fix patch generation
POST /api/advanced/architecture        — Architecture summarizer
POST /api/advanced/technical-debt      — Technical debt report
POST /api/advanced/complexity-refactor — Function split suggestions
POST /api/advanced/debug               — AI error debugger
POST /api/advanced/semantic-search     — Semantic code search
POST /api/advanced/bug-fix-agent       — Autonomous bug-fix agent
POST /api/advanced/knowledge-graph     — Code knowledge graph builder
```

### Intelligence
```
POST /api/polyglot/analyze             — Multi-language analysis (Python/JS/TS/Java)
POST /api/polyglot/multi-analyze       — Parallel multi-file static analysis
POST /api/extras/pr-review             — AI pull request reviewer
POST /api/extras/autopilot             — Multi-step improvement agent
POST /api/extras/architecture-refactor — Architecture refactoring suggestions
POST /api/extras/dependency-scan       — CVE scan via OSV database
POST /api/extras/plugins/run           — Run custom analyzer plugins
GET  /api/extras/plugins/list          — List available plugins
POST /api/extras/confidence-score      — AI confidence + evidence scoring
POST /api/extras/incremental-analyze   — Analyze only changed files (git diff)
POST /api/extras/learning-mode         — Educational code explanation
POST /api/extras/benchmark             — Multi-model benchmarking
POST /api/extras/performance           — Performance analyzer (O(n²), N+1, recursion)
POST /api/extras/generate-report       — Full report → Markdown + PDF export
```

### Analytics & Models
```
POST /api/analytics/save               — Save analysis snapshot to SQLite
GET  /api/analytics/history/{repo}     — Get historical quality data
GET  /api/analytics/repos              — List all tracked repositories
GET  /api/models                       — List available Ollama models
```

---

## System Architecture

```
Browser (React + Recharts + D3.js + Three.js)
  Collapsible Sidebar (25 pages, 3 groups)
         │
         ▼
FastAPI Backend  (http://localhost:8000)  v4.0 — 11 routers
         │
         ├── Language Engines     Python (AST+pylint) / JS / TS / Java
         ├── Code Parser          AST → functions, classes, imports
         ├── Static Analysis      pylint + bandit + flake8
         ├── Control Flow         branch paths, taint, loop detection
         ├── Duplicate Detector   token Jaccard similarity
         ├── Bug-Fix Agent        scan → extract issues → AI patches
         ├── Knowledge Graph      AST → D3 force graph
         ├── Confidence Scorer    pattern + static + AI evidence (0–100%)
         ├── Dependency Scanner   OSV API CVE lookup (PyPI + npm)
         ├── Plugin System        auto-discover plugins from plugins/
         ├── Parallel Engine      ThreadPoolExecutor multi-file analysis
         ├── Analytics DB         SQLite quality history
         ├── Incremental Scanner  MD5 hash diff → changed files only
         ├── Performance Analyzer O(n²), N+1, recursion detection
         ├── Report Generator     Markdown + PDF export
         ├── AI Engine            Ollama → DeepSeek Coder (1 call/analysis)
         └── RAG System           ChromaDB + sentence-transformers

VS Code Extension  (TypeScript)
         └── Calls same FastAPI backend — no extra setup needed
```

---

## Performance

The analysis pipeline is optimized to a **single AI call** per analysis:

| Before | After |
|--------|-------|
| 3 full-file AI calls + 2 per function × N functions | 1 combined prompt → review + bugs + per-function |
| ~3–5 min for a file with 8 functions | ~20–40 sec |

---

## Plugin System

Drop a file in `backend/plugins/` to add a custom analyzer:

```python
from analyzers.plugin_system import AnalyzerPlugin

class MyPlugin(AnalyzerPlugin):
    name = "my_checker"
    description = "Custom rule"
    version = "1.0.0"

    def analyze(self, code, filename="code", language="python"):
        issues = []
        # your logic here
        return {"issues": issues, "metrics": {}}
```

Plugins are auto-discovered. Run via `POST /api/extras/plugins/run`.
Two example plugins included: `complexity_plugin.py`, `license_checker.py`.

---

## Quality Score Formula

```
score = 10 − (bugs × 1.5 + security_issues × 2.0 + code_smells × 0.3)
score = clamp(score, 0, 10)
```

| Grade | Score |
|-------|-------|
| A+ | ≥ 9.5 |
| A  | ≥ 9.0 |
| B  | ≥ 7.0 |
| C  | ≥ 6.0 |
| D  | ≥ 5.0 |
| F  | < 5.0 |

---

## CLI Tool

```bash
cd ai-code-assistant/backend
python cli.py scan ./myproject
python cli.py review auth.py
python cli.py bugs auth.py
python cli.py security auth.py
python cli.py debug "TypeError: 'NoneType' object is not iterable"
```

---

## Project Structure

```
ai-code-assistant/
├── backend/
│   ├── main.py                    FastAPI v4.0 — 11 routers
│   ├── requirements.txt
│   ├── cli.py                     CLI tool
│   ├── analytics.db               SQLite (auto-created on first run)
│   ├── api/
│   │   ├── review.py / analyze.py / explain.py / docs_gen.py
│   │   ├── security.py / github.py / tests_gen.py
│   │   ├── advanced.py            10 advanced endpoints
│   │   ├── analytics.py           Historical quality tracking
│   │   ├── polyglot.py            Multi-language endpoints
│   │   └── extras.py              PR review, autopilot, deps, plugins,
│   │                              performance, report, benchmark, etc.
│   ├── analyzers/
│   │   ├── pipeline.py            Optimized single-call pipeline
│   │   ├── code_parser.py         AST parser
│   │   ├── static_analyzer.py     pylint / bandit / flake8
│   │   ├── control_flow.py        Branch + taint analysis
│   │   ├── duplicate_detector.py  Jaccard similarity
│   │   ├── bug_fix_agent.py       Autonomous patch generator
│   │   ├── knowledge_graph.py     AST → graph builder
│   │   ├── quality_score.py       Score calculator
│   │   ├── confidence_scorer.py   Evidence-based confidence scoring
│   │   ├── dependency_scanner.py  OSV CVE scanner
│   │   ├── parallel_engine.py     ThreadPoolExecutor multi-file
│   │   ├── incremental.py         Git diff → changed files
│   │   ├── analytics_db.py        SQLite history
│   │   └── plugin_system.py       Plugin loader
│   ├── language_engines/
│   │   ├── base.py / detector.py
│   │   ├── python/engine.py       AST + pylint + bandit
│   │   ├── javascript/engine.py   Regex + static checks
│   │   └── java/engine.py         Regex + static checks
│   ├── plugins/
│   │   ├── complexity_plugin.py   Flags functions > 50 lines
│   │   └── license_checker.py     Checks for license headers
│   └── ai_engine/
│       ├── ollama_client.py       Ollama HTTP client + model listing
│       ├── prompts.py             20+ prompt templates
│       ├── rag_chat.py            ChromaDB RAG
│       └── test_generator.py
├── frontend/
│   └── src/
│       ├── App.jsx                25 routes, collapsible sidebar layout
│       ├── api.js                 All API calls
│       ├── components/
│       │   ├── Sidebar.jsx        Collapsible left sidebar (3 groups)
│       │   ├── CodeAnalysisPage.jsx
│       │   ├── QualityScore.jsx   SVG arc gauge
│       │   ├── ResultBlock.jsx
│       │   └── Scene3D.jsx        Three.js particle scene
│       └── pages/                 25 feature pages
│           ├── Dashboard.jsx      Hero + stats + mini chart + upload
│           ├── AnalyticsPage.jsx  Recharts line + bar charts
│           ├── PerformancePage.jsx O(n²) / N+1 / recursion detector
│           ├── ReportPage.jsx     Markdown + PDF export
│           └── ... (21 more)
└── vscode-extension/
    ├── src/extension.ts           9 commands + sidebar webview
    ├── src/api.ts
    └── src/webview.ts
```
