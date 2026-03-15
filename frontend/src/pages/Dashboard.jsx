import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { uploadProject, getHistory, saveAnalysis } from "../api";

const FEATURES = [
  { to: "/review",         icon: "◈",  title: "Code Review",     desc: "Per-function AI review + quality score",  color: "#3b82f6" },
  { to: "/bugs",           icon: "◉",  title: "Bug Detection",   desc: "Logical errors, crashes, runtime issues", color: "#ef4444" },
  { to: "/security",       icon: "⬢",  title: "Security Scan",   desc: "SQL injection, secrets, unsafe eval",     color: "#f59e0b" },
  { to: "/bug-fix-agent",  icon: "🤖", title: "Bug-Fix Agent",   desc: "Autonomous scan → detect → AI patches",  color: "#f43f5e" },
  { to: "/knowledge-graph",icon: "🕸️", title: "Code Graph",      desc: "Interactive D3 map of call chains",       color: "#22d3ee" },
  { to: "/polyglot",       icon: "🌐", title: "Multi-Language",  desc: "Python · JS · TS · Java analysis",        color: "#a78bfa" },
  { to: "/pr-review",      icon: "🔀", title: "PR Review",       desc: "AI inline comments on git diffs",         color: "#7c3aed" },
  { to: "/autopilot",      icon: "🚀", title: "Autopilot",       desc: "Multi-step autonomous improvement agent", color: "#059669" },
  { to: "/dependencies",   icon: "🔒", title: "Dependency Scan", desc: "CVE scanner via OSV database",            color: "#dc2626" },
  { to: "/analytics",      icon: "📈", title: "Analytics",       desc: "Quality score trends over time",          color: "#0ea5e9" },
  { to: "/learning",       icon: "🎓", title: "Learning Mode",   desc: "Beginner / Intermediate / Advanced",      color: "#10b981" },
  { to: "/performance",    icon: "⚡", title: "Performance",     desc: "O(n²) loops, memory leaks, recursion",    color: "#f97316" },
];

const QUICK_STATS = [
  { label: "Features",          value: "25+", icon: "⬡", color: "#3b82f6" },
  { label: "Languages",         value: "4+",  icon: "🌐", color: "#a78bfa" },
  { label: "AI Calls/Analysis", value: "1",   icon: "⚡", color: "#10b981" },
  { label: "API Cost",          value: "$0",  icon: "💰", color: "#f59e0b" },
];

export default function Dashboard() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
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
      else {
        setResult(res.data);
        if (res.data.avg_quality_score) {
          saveAnalysis({ repo_name: "demo-project", quality_score: res.data.avg_quality_score, bug_count: 0, security_count: 0, code_smells: 0, grade: "B", files_analyzed: res.data.files_analyzed }).catch(() => {});
        }
      }
    } catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  };

  return (
    <div>
      {/* Hero */}
      <div style={{ position: "relative", minHeight: "55vh", overflow: "hidden", display: "flex", alignItems: "center", padding: "3rem 2rem" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 50%, #1e3a5f44 0%, transparent 60%), radial-gradient(ellipse at 70% 30%, #4c1d9544 0%, transparent 60%)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, #050810)", zIndex: 1 }} />
        <div style={{ position: "relative", zIndex: 2, maxWidth: "820px" }}>
          <div className="glass" style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "5px 14px", borderRadius: "999px", fontSize: "11px", color: "#93c5fd", marginBottom: "18px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#60a5fa", display: "inline-block" }} />
            DeepSeek Coder · Runs Locally · Zero API Cost
          </div>
          <h1 style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 800, lineHeight: 1.05, margin: "0 0 1rem" }}>
            <span className="gradient-text">AI Code</span>
            <br />
            <span style={{ color: "white" }}>Assistant</span>
          </h1>
          <p style={{ fontSize: "1rem", color: "#9ca3af", maxWidth: "460px", marginBottom: "1.75rem" }}>
            SonarQube + GitHub Copilot + Snyk — in one tool, running locally for free.
          </p>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link to="/review"><button style={{ padding: "11px 26px", background: "#2563eb", border: "none", borderRadius: "12px", color: "white", fontWeight: 600, cursor: "pointer" }}>Start Reviewing →</button></Link>
            <button onClick={() => document.getElementById("upload-section").scrollIntoView({ behavior: "smooth" })} className="glass" style={{ padding: "11px 26px", border: "none", borderRadius: "12px", color: "#d1d5db", fontWeight: 600, cursor: "pointer" }}>Upload Project</button>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 2rem 4rem" }}>
        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem", marginBottom: "2.5rem" }}>
          {QUICK_STATS.map(s => (
            <div key={s.label} className="glass" style={{ borderRadius: 16, padding: "1.25rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.6rem", marginBottom: "0.25rem" }}>{s.icon}</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: "2px" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Mini quality chart */}
        {history.length > 0 && (
          <div className="glass" style={{ borderRadius: 16, padding: "1.25rem", marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
              <span style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 600 }}>Quality Score History</span>
              <Link to="/analytics" style={{ fontSize: "0.72rem", color: "#3b82f6", textDecoration: "none" }}>View full analytics →</Link>
            </div>
            <MiniChart data={history} />
          </div>
        )}

        {/* Feature grid */}
        <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "1.25rem", color: "#e5e7eb" }}>All Features</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "0.875rem", marginBottom: "3rem" }}>
          {FEATURES.map(f => (
            <Link key={f.to} to={f.to} style={{ textDecoration: "none" }}>
              <div className="glass card-hover" style={{ borderRadius: 14, padding: "1rem", cursor: "pointer", display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: f.color + "22", border: `1px solid ${f.color}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                  {f.icon}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "white", marginBottom: "2px" }}>{f.title}</div>
                  <div style={{ fontSize: "0.72rem", color: "#6b7280", lineHeight: 1.4 }}>{f.desc}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Upload */}
        <div id="upload-section">
          <div className="glass glow-blue" style={{ borderRadius: 20, padding: "2rem" }}>
            <h2 style={{ fontSize: "1.4rem", fontWeight: 700, marginBottom: "0.4rem" }}>Analyze Entire Project</h2>
            <p style={{ color: "#9ca3af", marginBottom: "1.25rem", fontSize: "0.85rem" }}>Upload a ZIP — AI scans every file and returns a full report.</p>
            <div style={{ border: "2px dashed #374151", borderRadius: 12, padding: "1.75rem", textAlign: "center", marginBottom: "1rem" }}>
              <div className="float" style={{ fontSize: "2.2rem", marginBottom: "0.5rem" }}>📦</div>
              <p style={{ color: "#6b7280", fontSize: "0.78rem", marginBottom: "0.75rem" }}>Supports .py .js .ts .jsx .tsx</p>
              <input type="file" accept=".zip" id="zip-input" style={{ display: "none" }} onChange={e => { setFile(e.target.files[0]); setResult(null); setError(null); }} />
              <label htmlFor="zip-input" className="glass" style={{ padding: "6px 16px", borderRadius: 8, cursor: "pointer", fontSize: "0.78rem", color: file ? "#34d399" : "#d1d5db" }}>
                {file ? `✓ ${file.name}` : "Choose ZIP file"}
              </label>
            </div>
            <button onClick={handleUpload} disabled={loading || !file}
              style={{ width: "100%", padding: "12px", background: loading || !file ? "#1e3a5f" : "linear-gradient(135deg,#2563eb,#7c3aed)", border: "none", borderRadius: 12, color: "white", fontWeight: 600, cursor: loading || !file ? "not-allowed" : "pointer" }}>
              {loading ? "AI is analyzing..." : "Analyze Project →"}
            </button>
            {error && <div style={{ marginTop: "0.875rem", padding: "0.875rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 10, color: "#fca5a5", fontSize: "0.8rem" }}>{error}</div>}
            {result && <UploadResult result={result} />}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniChart({ data }) {
  const reversed = [...data].reverse().slice(-12);
  const max = Math.max(...reversed.map(h => h.quality_score), 10);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "5px", height: "56px" }}>
      {reversed.map((h, i) => {
        const pct = (h.quality_score / max) * 100;
        const color = h.quality_score >= 8 ? "#10b981" : h.quality_score >= 6 ? "#3b82f6" : h.quality_score >= 4 ? "#f59e0b" : "#ef4444";
        return (
          <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            <div style={{ fontSize: "0.5rem", color: "#4b5563" }}>{h.quality_score?.toFixed(1)}</div>
            <div style={{ width: "100%", height: `${pct}%`, background: color, borderRadius: "3px 3px 0 0", minHeight: 3 }} title={`${h.timestamp?.slice(0, 10)}: ${h.quality_score}`} />
          </div>
        );
      })}
    </div>
  );
}

function UploadResult({ result }) {
  return (
    <div style={{ marginTop: "1.5rem" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginBottom: "1rem" }}>
        {[["Files Analyzed", result.files_analyzed, "#3b82f6"], ["Avg Quality", `${result.avg_quality_score}/10`, "#10b981"], ["Session", result.session_id?.slice(0, 8), "#8b5cf6"]].map(([l, v, c]) => (
          <div key={l} className="glass" style={{ borderRadius: 10, padding: "0.75rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.2rem", fontWeight: 700, color: c }}>{v}</div>
            <div style={{ fontSize: "0.68rem", color: "#6b7280", marginTop: "2px" }}>{l}</div>
          </div>
        ))}
      </div>
      {result.files_analyzed === 0 && (
        <div style={{ padding: "0.75rem", background: "#451a03", border: "1px solid #92400e", borderRadius: 10, color: "#fcd34d", fontSize: "0.78rem" }}>
          No supported source files found in ZIP (.py .js .ts .jsx .tsx)
        </div>
      )}
      {Object.entries(result.results || {}).map(([filename, data]) => (
        <FileCard key={filename} filename={filename} data={data} />
      ))}
    </div>
  );
}

function FileCard({ filename, data }) {
  const [open, setOpen] = useState(false);
  const score = data.quality?.score;
  const scoreColor = score >= 8 ? "#10b981" : score >= 6 ? "#3b82f6" : score >= 4 ? "#f59e0b" : "#ef4444";
  return (
    <div className="glass" style={{ borderRadius: 10, overflow: "hidden", marginBottom: "0.5rem" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", background: "transparent", border: "none", cursor: "pointer", color: "white" }}>
        <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#93c5fd" }}>{filename}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {score !== undefined && <span style={{ fontWeight: 700, color: scoreColor, fontSize: "0.82rem" }}>{score}/10</span>}
          <span style={{ color: "#6b7280", fontSize: "0.68rem" }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {data.error && <p style={{ color: "#f87171", fontSize: "0.72rem" }}>{data.error}</p>}
          {data.functions?.length > 0 && <p style={{ color: "#9ca3af", fontSize: "0.7rem", marginBottom: "0.4rem" }}>Functions: {data.functions.join(", ")}</p>}
          {data.ai_bugs && <pre style={{ fontSize: "0.7rem", color: "#d1d5db", whiteSpace: "pre-wrap", fontFamily: "monospace" }}>{data.ai_bugs}</pre>}
        </div>
      )}
    </div>
  );
}
