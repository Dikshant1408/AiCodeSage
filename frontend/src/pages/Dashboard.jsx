import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { uploadProject, getHistory } from "../api";

// Only features that require a running system — not possible in any AI chat
const FEATURES = [
  {
    to: "/pipeline",
    icon: "⚡",
    title: "Autonomous Pipeline",
    desc: "4 agents: analyze → patch → verify → report. Verification loop proves fixes work.",
    color: "#6366f1",
    tag: "FLAGSHIP",
  },
  {
    to: "/security",
    icon: "⬢",
    title: "Taint Path Visualizer",
    desc: "AST data-flow tracking. Traces user input → dangerous sinks. Shows exact injection paths.",
    color: "#ef4444",
    tag: "FLAGSHIP",
  },
  {
    to: "/knowledge-graph",
    icon: "🕸️",
    title: "Code Knowledge Graph",
    desc: "AST-built call graph. Files → functions → classes → imports. D3 visualization.",
    color: "#22d3ee",
    tag: "FLAGSHIP",
  },
  {
    to: "/duplicates",
    icon: "⧉",
    title: "Duplicate Detector",
    desc: "Jaccard token similarity. Finds near-duplicate functions across files algorithmically.",
    color: "#a78bfa",
  },
  {
    to: "/control-flow",
    icon: "⟳",
    title: "Control Flow Analysis",
    desc: "Cyclomatic complexity, infinite loop detection, branch path mapping via AST.",
    color: "#3b82f6",
  },
  {
    to: "/bug-fix-agent",
    icon: "🤖",
    title: "Bug-Fix Agent",
    desc: "Autonomous: scan all files → extract issues → AI patch per issue → confidence score.",
    color: "#f43f5e",
  },
  {
    to: "/dependencies",
    icon: "🔒",
    title: "CVE Dependency Scanner",
    desc: "Queries OSV database for real CVEs in your requirements.txt / package.json.",
    color: "#dc2626",
  },
  {
    to: "/analytics",
    icon: "📈",
    title: "Quality Score History",
    desc: "SQLite-backed trending. Tracks quality, bugs, security across every analysis run.",
    color: "#0ea5e9",
  },
  {
    to: "/performance",
    icon: "⚡",
    title: "Performance Analyzer",
    desc: "Detects O(n²) loops, N+1 queries, unbounded recursion via static pattern matching.",
    color: "#f97316",
  },
  {
    to: "/polyglot",
    icon: "🌐",
    title: "Multi-Language Engines",
    desc: "Separate AST engines for Python, JavaScript, TypeScript, Java. Not just regex.",
    color: "#8b5cf6",
  },
  {
    to: "/architecture",
    icon: "🏗️",
    title: "Architecture Analysis",
    desc: "Parses entire codebase structure. Identifies layers, coupling, and design patterns.",
    color: "#10b981",
  },
  {
    to: "/github",
    icon: "🐙",
    title: "Repo RAG Chat",
    desc: "Clones repo → ChromaDB embeddings → semantic search. Grounded answers, not hallucinations.",
    color: "#6b7280",
  },
];

const WHY_DIFFERENT = [
  { icon: "🔬", text: "Runs pylint + bandit + flake8 — actual static analysis, not AI guessing" },
  { icon: "🧬", text: "AST taint tracking traces data flow through your code's syntax tree" },
  { icon: "🔁", text: "Verification loop: re-runs analysis after patching to prove improvement" },
  { icon: "💾", text: "Persistent memory: SQLite stores quality history across every session" },
  { icon: "🕸️", text: "Knowledge graph built from AST — not summarized from text" },
  { icon: "🔒", text: "CVE data from OSV API — real vulnerability records, not AI knowledge" },
];

export default function Dashboard() {
  const [file, setFile]       = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    getHistory("demo-project", 10).then(r => setHistory(r.data.history || [])).catch(() => {});
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await uploadProject(file);
      if (res.data.error) setError(res.data.error);
      else setResult(res.data);
    } catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  };

  return (
    <div>
      {/* Hero */}
      <div style={{ position: "relative", minHeight: "52vh", overflow: "hidden", display: "flex", alignItems: "center", padding: "3rem 2rem" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 25% 50%, #1e1b4b55 0%, transparent 60%), radial-gradient(ellipse at 75% 30%, #1e3a5f44 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, #050810)", zIndex: 1 }} />
        <div style={{ position: "relative", zIndex: 2, maxWidth: 820 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 14px", borderRadius: 999, fontSize: 11, color: "#a5b4fc", marginBottom: 18, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", display: "inline-block" }} />
            Static Analysis Engines · AST Taint Tracking · 4-Agent Pipeline
          </div>
          <h1 style={{ fontSize: "clamp(2.2rem,5vw,4rem)", fontWeight: 800, lineHeight: 1.05, margin: "0 0 1rem" }}>
            <span style={{ background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AiCodeSage</span>
            <br />
            <span style={{ color: "white", fontSize: "0.65em" }}>Not a chatbot. A code intelligence engine.</span>
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", maxWidth: 500, marginBottom: "1.75rem", lineHeight: 1.6 }}>
            ChatGPT reads your code. This system <em style={{ color: "#9ca3af" }}>runs</em> on it — static analysis, AST parsing, taint tracking, CVE lookups, and a verification loop that proves fixes actually work.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/pipeline">
              <button style={{ padding: "11px 26px", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, cursor: "pointer", fontSize: "0.88rem" }}>⚡ Run Pipeline →</button>
            </Link>
            <Link to="/security">
              <button style={{ padding: "11px 26px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, color: "#fca5a5", fontWeight: 600, cursor: "pointer", fontSize: "0.88rem" }}>⬢ Taint Analysis</button>
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 2rem 4rem" }}>

        {/* Why different */}
        <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 16, padding: "1.25rem 1.5rem", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: "0.65rem", color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "0.875rem" }}>Why this is different from ChatGPT / Claude / Copilot</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.6rem" }}>
            {WHY_DIFFERENT.map((w, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                <span style={{ fontSize: "0.9rem", flexShrink: 0, marginTop: 1 }}>{w.icon}</span>
                <span style={{ fontSize: "0.75rem", color: "#9ca3af", lineHeight: 1.5 }}>{w.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quality history mini chart */}
        {history.length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.1rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600 }}>Quality Score History (persistent memory)</span>
              <Link to="/analytics" style={{ fontSize: "0.7rem", color: "#6366f1", textDecoration: "none" }}>Full analytics →</Link>
            </div>
            <MiniChart data={history} />
          </div>
        )}

        {/* Feature grid */}
        <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "1rem" }}>
          System-Level Capabilities
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "0.875rem", marginBottom: "3rem" }}>
          {FEATURES.map(f => (
            <Link key={f.to} to={f.to} style={{ textDecoration: "none" }}>
              <div style={{ borderRadius: 14, padding: "1rem", cursor: "pointer", display: "flex", gap: "0.75rem", alignItems: "flex-start", background: "rgba(255,255,255,0.02)", border: `1px solid ${f.tag ? f.color + "33" : "rgba(255,255,255,0.06)"}`, transition: "border-color 0.15s, background 0.15s" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: f.color + "18", border: `1px solid ${f.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "3px" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.83rem", color: "white" }}>{f.title}</span>
                    {f.tag && <span style={{ fontSize: "0.55rem", padding: "1px 6px", borderRadius: 4, background: f.color + "22", color: f.color, border: `1px solid ${f.color}44`, fontWeight: 700, letterSpacing: "0.05em" }}>{f.tag}</span>}
                  </div>
                  <div style={{ fontSize: "0.71rem", color: "#6b7280", lineHeight: 1.45 }}>{f.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* ZIP upload */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, padding: "2rem" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: 700, marginBottom: "0.4rem", color: "#e5e7eb" }}>Analyze Entire Project</h2>
          <p style={{ color: "#6b7280", marginBottom: "1.25rem", fontSize: "0.82rem" }}>Upload a ZIP — static analysis runs on every file, quality scores aggregated, RAG chat indexed.</p>
          <div style={{ border: "2px dashed rgba(255,255,255,0.08)", borderRadius: 12, padding: "1.5rem", textAlign: "center", marginBottom: "1rem" }}>
            <div style={{ fontSize: "2rem", marginBottom: "0.5rem", opacity: 0.4 }}>📦</div>
            <p style={{ color: "#4b5563", fontSize: "0.75rem", marginBottom: "0.75rem" }}>Supports .py .js .ts .jsx .tsx</p>
            <input type="file" accept=".zip" id="zip-input" style={{ display: "none" }} onChange={e => { setFile(e.target.files[0]); setResult(null); setError(null); }} />
            <label htmlFor="zip-input" style={{ padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: "0.75rem", color: file ? "#34d399" : "#9ca3af", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {file ? `✓ ${file.name}` : "Choose ZIP file"}
            </label>
          </div>
          <button onClick={handleUpload} disabled={loading || !file}
            style={{ width: "100%", padding: "12px", background: loading || !file ? "rgba(255,255,255,0.04)" : "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 12, color: loading || !file ? "#4b5563" : "white", fontWeight: 600, cursor: loading || !file ? "not-allowed" : "pointer", fontSize: "0.88rem" }}>
            {loading ? "Analyzing..." : "Analyze Project →"}
          </button>
          {error && <div style={{ marginTop: "0.875rem", padding: "0.875rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 10, color: "#fca5a5", fontSize: "0.78rem" }}>{error}</div>}
          {result && <UploadResult result={result} />}
        </div>
      </div>
    </div>
  );
}

function MiniChart({ data }) {
  const items = [...data].reverse().slice(-14);
  const max = Math.max(...items.map(h => h.quality_score), 10);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "48px" }}>
      {items.map((h, i) => {
        const pct = (h.quality_score / max) * 100;
        const color = h.quality_score >= 8 ? "#10b981" : h.quality_score >= 6 ? "#6366f1" : h.quality_score >= 4 ? "#f59e0b" : "#ef4444";
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            <div style={{ fontSize: "0.48rem", color: "#374151" }}>{h.quality_score?.toFixed(1)}</div>
            <div style={{ width: "100%", height: `${pct}%`, background: color, borderRadius: "2px 2px 0 0", minHeight: 3 }} title={`${h.timestamp?.slice(0, 10)}: ${h.quality_score}`} />
          </div>
        );
      })}
    </div>
  );
}

function UploadResult({ result }) {
  const [open, setOpen] = useState({});
  const scoreColor = s => s >= 8 ? "#10b981" : s >= 6 ? "#6366f1" : s >= 4 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
        {[["Files Analyzed", result.files_analyzed, "#6366f1"], ["Avg Quality", `${result.avg_quality_score}/10`, "#10b981"], ["Session", result.session_id?.slice(0, 8), "#8b5cf6"]].map(([l, v, c]) => (
          <div key={l} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: "0.65rem", color: "#6b7280", marginTop: "2px" }}>{l}</div>
          </div>
        ))}
      </div>
      {Object.entries(result.results || {}).map(([filename, data]) => (
        <div key={filename} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, overflow: "hidden", marginBottom: "0.4rem" }}>
          <button onClick={() => setOpen(o => ({ ...o, [filename]: !o[filename] }))} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.7rem 0.875rem", background: "transparent", border: "none", cursor: "pointer", color: "white" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.76rem", color: "#93c5fd" }}>{filename}</span>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              {data.quality?.score !== undefined && <span style={{ fontWeight: 700, color: scoreColor(data.quality.score), fontSize: "0.8rem" }}>{data.quality.score}/10</span>}
              <span style={{ color: "#4b5563", fontSize: "0.65rem" }}>{open[filename] ? "▲" : "▼"}</span>
            </div>
          </button>
          {open[filename] && (
            <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
              {data.error && <p style={{ color: "#f87171", fontSize: "0.72rem" }}>{data.error}</p>}
              {data.functions?.length > 0 && <p style={{ color: "#9ca3af", fontSize: "0.7rem", marginBottom: "0.4rem" }}>Functions: {data.functions.join(", ")}</p>}
              {data.ai_bugs && <pre style={{ fontSize: "0.7rem", color: "#d1d5db", whiteSpace: "pre-wrap", fontFamily: "monospace", margin: 0 }}>{data.ai_bugs}</pre>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
