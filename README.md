# AiCodeSage v5.0

**Multi-Agent Code Intelligence Platform** — MCA Final Year Project

> Not a chatbot. A code intelligence engine that *runs* on your code using static analysis, AST parsing, taint tracking, and a 4-agent autonomous improvement pipeline.

---

## What Makes This Different from ChatGPT / Claude / Copilot

| Capability | ChatGPT | AiCodeSage |
|---|---|---|
| Runs pylint + bandit + flake8 | ✗ | ✅ (parallel) |
| AST taint flow tracking | ✗ | ✅ |
| Verifies AI patches actually work | ✗ | ✅ (re-runs static analysis) |
| Persistent quality score history | ✗ | ✅ (SQLite) |
| Real CVE data from OSV database | ✗ | ✅ |
| Jaccard token similarity for duplicates | ✗ | ✅ |
| Knowledge graph from AST traversal | ✗ | ✅ |
| Grounded RAG chat over your repo | ✗ | ✅ (ChromaDB) |

---

## Architecture

```
Frontend (React + Vite)
        ↓
Backend (FastAPI)
        ↓
┌─────────────────────────────────────┐
│         4-Agent Pipeline            │
│  Agent 1: Static Analyzer           │  pylint + bandit + flake8 (parallel)
│  Agent 2: Patch Generator           │  Groq LLM → fixed code
│  Agent 3: Verifier                  │  re-runs static analysis on patch
│  Agent 4: Report Writer             │  before/after executive summary
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│         Static Engines              │
│  AST Control Flow + Taint Tracker   │
│  Jaccard Duplicate Detector         │
│  Knowledge Graph Builder            │
│  Performance Pattern Matcher        │
│  OSV CVE Scanner                    │
└─────────────────────────────────────┘
        ↓
┌─────────────────────────────────────┐
│         Data Layer                  │
│  SQLite — quality history           │
│  ChromaDB — code embeddings (RAG)   │
│  MD5 cache — incremental analysis   │
└─────────────────────────────────────┘
```

---

## Features

### Core Engine
| Feature | Description | AI? |
|---|---|---|
| **Autonomous Pipeline** | 4 agents: analyze → patch → verify → report | Agent 2 + 4 |
| **Taint Path Visualizer** | Traces user input → dangerous sinks via AST | No |
| **Quality Score History** | SQLite-backed trending across sessions | No |

### Static Intelligence
| Feature | Description | AI? |
|---|---|---|
| **Control Flow Analysis** | Cyclomatic complexity, infinite loops, branch paths | No |
| **Duplicate Detector** | Jaccard token similarity, finds near-duplicates across files | No |
| **Knowledge Graph** | AST call graph — files, functions, classes, imports, calls | No |
| **Bug-Fix Agent** | Scan → extract issues → AI patch per issue → confidence score | Yes |
| **Performance Analyzer** | O(n²) loops, N+1 queries, unbounded recursion | No |
| **Architecture Analysis** | Parses codebase structure, identifies patterns | Yes |
| **Multi-Language Engines** | Separate AST parsers for Python, JS, Java | No |

### Data & Memory
| Feature | Description | AI? |
|---|---|---|
| **CVE Scanner** | Queries OSV API for real CVEs in requirements.txt / package.json | No |
| **Repo RAG Chat** | Clone repo → ChromaDB embeddings → grounded answers | Yes |
| **Code Review** | Static analysis + single AI call | Yes |
| **Export Report** | Full intelligence report — static + taint + graph + AI summary | Yes |

---

## Tech Stack

**Backend**
- Python 3.12, FastAPI, uvicorn
- Groq API (llama-3.1-8b-instant) — free tier
- pylint, bandit, flake8 — static analysis
- ChromaDB + sentence-transformers — RAG
- SQLite — persistent storage
- JWT (HMAC-SHA256) — auth, no extra deps

**Frontend**
- React 18, Vite, React Router
- Recharts — analytics charts
- D3.js — knowledge graph visualization
- Three.js — 3D particle scene
- jsPDF — PDF export
- Inline styles only (no Tailwind)

---

## Project Structure

```
ai-code-assistant/
├── backend/
│   ├── api/
│   │   ├── auth.py          # JWT login/signup/forgot-password
│   │   ├── pipeline_api.py  # 4-agent autonomous pipeline
│   │   ├── advanced.py      # control flow, duplicates, graph, bug-fix agent
│   │   ├── security.py      # bandit + taint tracking
│   │   ├── analytics.py     # SQLite quality history
│   │   ├── extras.py        # CVE scan, performance, incremental, plugins
│   │   ├── polyglot.py      # multi-language static engines
│   │   ├── review.py        # static + AI pipeline
│   │   ├── analyze.py       # ZIP upload, RAG chat
│   │   ├── github.py        # repo clone + RAG
│   │   └── report_api.py    # full intelligence report
│   ├── analyzers/
│   │   ├── static_analyzer.py    # pylint/bandit/flake8 parallel runner
│   │   ├── control_flow.py       # AST taint tracking + branch analysis
│   │   ├── duplicate_detector.py # Jaccard token similarity
│   │   ├── knowledge_graph.py    # AST call graph builder
│   │   ├── quality_score.py      # scoring formula
│   │   ├── dependency_scanner.py # OSV CVE API
│   │   ├── confidence_scorer.py  # evidence-based confidence
│   │   ├── incremental.py        # MD5 change detection
│   │   ├── parallel_engine.py    # ThreadPoolExecutor orchestration
│   │   ├── bug_fix_agent.py      # autonomous issue → patch agent
│   │   ├── pipeline.py           # single-file analysis pipeline
│   │   └── plugin_system.py      # dynamic plugin loader
│   ├── ai_engine/
│   │   ├── ollama_client.py  # Groq API (lazy singleton)
│   │   ├── prompts.py        # concise prompt templates
│   │   ├── rag_chat.py       # ChromaDB RAG
│   │   └── test_generator.py
│   ├── language_engines/     # Python / JS / Java AST engines
│   ├── plugins/              # complexity_plugin, license_checker
│   ├── main.py
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/
        │   ├── Dashboard.jsx
        │   ├── PipelinePage.jsx      # flagship — 4-agent pipeline UI
        │   ├── SecurityPage.jsx      # taint path visualizer
        │   ├── AnalyticsPage.jsx     # quality history charts
        │   ├── ControlFlowPage.jsx
        │   ├── DuplicatesPage.jsx
        │   ├── KnowledgeGraphPage.jsx
        │   ├── BugFixAgentPage.jsx
        │   ├── PerformancePage.jsx
        │   ├── ArchitecturePage.jsx
        │   ├── PolyglotPage.jsx
        │   ├── DependencyPage.jsx
        │   ├── GithubPage.jsx
        │   ├── ReviewPage.jsx
        │   ├── ReportPage.jsx
        │   └── AuthPage.jsx          # login / signup / forgot password
        └── components/
            ├── Sidebar.jsx
            ├── QualityScore.jsx
            └── ResultBlock.jsx
```

---

## Setup

### Prerequisites
- Python 3.12
- Node.js 18+
- Groq API key (free at [console.groq.com](https://console.groq.com))

### Backend

```bash
cd ai-code-assistant/backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create `.env`:
```
GROQ_API_KEY=your_key_here
JWT_SECRET=change-this-in-production
```

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```bash
cd ai-code-assistant/frontend
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:3001

---

## API Endpoints

| Router | Prefix | Key Endpoints |
|---|---|---|
| Auth | `/api/auth` | POST /signup, /login, /forgot-password, /reset-password |
| Pipeline | `/api/pipeline` | POST /run |
| Advanced | `/api/advanced` | POST /control-flow, /duplicates, /knowledge-graph, /bug-fix-agent |
| Security | `/api/security` | POST / |
| Analytics | `/api/analytics` | POST /save, GET /history/{repo} |
| Extras | `/api/extras` | POST /dependency-scan, /performance, /confidence-score |
| Polyglot | `/api/polyglot` | POST /analyze, /multi-analyze |
| Review | `/api/review` | POST / |
| Analyze | `/api/analyze` | POST /upload, /bugs, /chat |
| GitHub | `/api/github` | POST / |
| Report | `/api/report` | POST /generate |

---

## Quality Score Formula

```
score = 10 - (bugs × 1.5 + security_issues × 2.0 + code_smells × 0.3)
score = clamp(score, 0, 10)
```

| Score | Grade |
|---|---|
| 9–10 | A+ |
| 8–9  | A  |
| 7–8  | B  |
| 6–7  | C  |
| 5–6  | D  |
| < 5  | F  |

---

## Performance Optimizations

- pylint + bandit + flake8 run in **parallel threads** (3x faster than sequential)
- Tool timeout reduced from 30s → 10s
- AI prompts capped at 800–1500 chars (2x faster Groq responses)
- Knowledge graph skips AI call — summary built from stats
- Performance analyzer skips AI when static analysis already found issues
- ZIP upload uses static-only analysis (no AI) — instant for large projects
- Groq client is a **lazy singleton** — initialized once after dotenv loads
- Pipeline Agent 2 patches 2 files in **parallel threads**

---

## Auth System

- Passwords: PBKDF2-SHA256 with random salt (260,000 iterations)
- Tokens: HMAC-SHA256 JWT, 72h expiry, no external dependencies
- Forgot password: 6-character OTP token, 1h expiry, shown in UI (demo mode) or emailed if SMTP configured
- Users stored in `users.db` (SQLite, excluded from git)

---

## Deployment

**Backend → Render**
- Build: `pip install -r requirements.txt`
- Start: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Env vars: `GROQ_API_KEY`, `JWT_SECRET`

**Frontend → Vercel**
- Root: `ai-code-assistant/frontend`
- Env vars: `VITE_API_URL=https://your-render-url.onrender.com`

---

*MCA Final Year Project — AiCodeSage v5.0*
