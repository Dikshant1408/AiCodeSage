import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHistory } from "../api";
import { getLastAnalysis } from "../lib/lastAnalysis";

const TOOLS = [
  { to: "/summary",      icon: "💬", title: "Project Summary",   desc: "Plain English explanation of what your project is, what it does, how it works, and what it could become.", color: "#a78bfa", cta: "Summarize →" },
  { to: "/repo",         icon: "📋", title: "Project Report",    desc: "Full analysis: every issue with exact file and line, how to fix each one, improvements, export to Markdown.", color: "#6366f1", cta: "Start here →" },
  { to: "/pipeline",     icon: "⚡",  title: "Auto Fix Pipeline", desc: "Finds worst issues, generates AI fixes, re-runs static analysis to verify the score actually improved.", color: "#8b5cf6", cta: "Run pipeline →" },
  { to: "/security",     icon: "⬢",  title: "Security Scan",     desc: "SQL injection, hardcoded secrets, unsafe eval. Traces user input to dangerous sinks across file boundaries.", color: "#ef4444", cta: "Scan code →" },
  { to: "/dependencies", icon: "🔒", title: "CVE Scanner",       desc: "Paste requirements.txt or package.json. Checks every dependency against the live OSV vulnerability database.", color: "#dc2626", cta: "Check deps →" },
  { to: "/review",       icon: "◈",  title: "Code Review",       desc: "Paste any code snippet. Quality score, bug list from static analysis, per-function review.", color: "#3b82f6", cta: "Review code →" },
  { to: "/github",       icon: "🐙", title: "GitHub Chat",       desc: "Paste a public GitHub URL. Repo gets cloned, indexed, and you can ask questions about the codebase.", color: "#6b7280", cta: "Chat with repo →" },
  { to: "/google-search",icon: "🔎", title: "Google Search",     desc: "Run Google searches from inside the app using your Programmable Search Engine API credentials.", color: "#2563eb", cta: "Search web →" },
  { to: "/analytics",    icon: "📈", title: "Quality History",   desc: "Every analysis saves a quality score. See if your codebase is improving or getting worse over time.", color: "#0ea5e9", cta: "View history →" },
];

const sc = s => s >= 8 ? "#10b981" : s >= 6 ? "#6366f1" : s >= 4 ? "#f59e0b" : "#ef4444";

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [last, setLast] = useState(null);

  useEffect(() => {
    // Load last analysis from localStorage (saved by any tool)
    setLast(getLastAnalysis());
    // Load quality history
    getHistory("demo-project", 10).then(r => setHistory(r.data.history || [])).catch(() => {});
  }, []);

  const TOOL_LABELS = { review: "Code Review", security: "Security Scan", repo: "Project Report", pipeline: "Auto Fix Pipeline", summary: "Project Summary", github: "GitHub Chat" };
  const TOOL_ROUTES = { review: "/review", security: "/security", repo: "/repo", pipeline: "/pipeline", summary: "/summary", github: "/github" };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 2rem" }}>
      {/* Hero */}
      <div style={{ marginBottom: "2.5rem" }}>
        <h1 style={{ margin: "0 0 0.75rem", fontSize: "2.2rem", fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          AiCodeSage
        </h1>
        <p style={{ margin: "0 0 1.5rem", fontSize: "1rem", color: "#9ca3af", lineHeight: 1.6, maxWidth: 600 }}>
          A connected system of developer tools — each one feeds into the next. Start with a project report, fix issues with the pipeline, track improvement over time.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <Link to="/repo">
            <button style={{ padding: "11px 24px", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 11, color: "white", fontWeight: 700, cursor: "pointer", fontSize: "0.9rem" }}>
              📋 Analyze My Project →
            </button>
          </Link>
          <Link to="/summary">
            <button style={{ padding: "11px 24px", background: "rgba(167,139,250,0.12)", border: "1px solid rgba(167,139,250,0.3)", borderRadius: 11, color: "#c4b5fd", fontWeight: 600, cursor: "pointer", fontSize: "0.9rem" }}>
              💬 Summarize Project
            </button>
          </Link>
        </div>
      </div>

      {/* Last analysis banner — shows real data from last tool used */}
      {last && (
        <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: "0.62rem", color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "0.25rem" }}>
              Last used: {TOOL_LABELS[last.tool] || last.tool}
              {last.repo_name && <span style={{ color: "#6b7280", fontWeight: 400 }}> · {last.repo_name}</span>}
              <span style={{ color: "#374151", fontWeight: 400, marginLeft: "0.5rem" }}>{last.saved_at ? new Date(last.saved_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</span>
            </div>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
              {last.score !== undefined && (
                <span style={{ fontSize: "0.82rem", color: sc(last.score), fontWeight: 700 }}>Score: {last.score}/10 {last.grade && `(${last.grade})`}</span>
              )}
              {last.score_after !== undefined && (
                <span style={{ fontSize: "0.82rem", color: "#10b981", fontWeight: 700 }}>{last.score_before?.toFixed(1)} → {last.score_after?.toFixed(1)} (+{(last.score_after - last.score_before)?.toFixed(1)})</span>
              )}
              {last.files !== undefined && <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>{last.files} files</span>}
              {last.issues !== undefined && <span style={{ fontSize: "0.78rem", color: "#6b7280" }}>{last.issues} issues found</span>}
              {last.improved !== undefined && <span style={{ fontSize: "0.78rem", color: "#10b981" }}>{last.improved} files improved</span>}
            </div>
          </div>
          {TOOL_ROUTES[last.tool] && (
            <Link to={TOOL_ROUTES[last.tool]} style={{ textDecoration: "none" }}>
              <button style={{ padding: "7px 16px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 8, color: "#a5b4fc", fontSize: "0.78rem", cursor: "pointer", fontWeight: 600, whiteSpace: "nowrap" }}>
                Continue →
              </button>
            </Link>
          )}
        </div>
      )}

      {/* How the system connects */}
      <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "1rem 1.25rem", marginBottom: "2rem" }}>
        <div style={{ fontSize: "0.62rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "0.75rem" }}>How the tools connect</div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
          {[
            { label: "Project Report", color: "#6366f1", desc: "finds all issues" },
            { label: "→", color: "#374151", desc: "" },
            { label: "Auto Fix Pipeline", color: "#8b5cf6", desc: "fixes worst files" },
            { label: "→", color: "#374151", desc: "" },
            { label: "Quality History", color: "#0ea5e9", desc: "tracks improvement" },
          ].map((item, i) => item.label === "→" ? (
            <span key={i} style={{ color: "#374151", fontSize: "1rem" }}>→</span>
          ) : (
            <div key={i} style={{ padding: "4px 10px", borderRadius: 6, background: `${item.color}15`, border: `1px solid ${item.color}33` }}>
              <span style={{ fontSize: "0.72rem", color: item.color, fontWeight: 600 }}>{item.label}</span>
              {item.desc && <span style={{ fontSize: "0.65rem", color: "#4b5563", marginLeft: "0.4rem" }}>{item.desc}</span>}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginTop: "0.5rem" }}>
          {[
            { label: "Security Scan", color: "#ef4444", desc: "finds vulnerabilities" },
            { label: "→", color: "#374151", desc: "" },
            { label: "CVE Scanner", color: "#dc2626", desc: "checks dependencies" },
            { label: "→", color: "#374151", desc: "" },
            { label: "Project Report", color: "#6366f1", desc: "full picture" },
          ].map((item, i) => item.label === "→" ? (
            <span key={i} style={{ color: "#374151", fontSize: "1rem" }}>→</span>
          ) : (
            <div key={i} style={{ padding: "4px 10px", borderRadius: 6, background: `${item.color}15`, border: `1px solid ${item.color}33` }}>
              <span style={{ fontSize: "0.72rem", color: item.color, fontWeight: 600 }}>{item.label}</span>
              {item.desc && <span style={{ fontSize: "0.65rem", color: "#4b5563", marginLeft: "0.4rem" }}>{item.desc}</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Quality history */}
      {history.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.1rem", marginBottom: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.78rem", color: "#9ca3af", fontWeight: 600 }}>Quality Score History</span>
            <Link to="/analytics" style={{ fontSize: "0.72rem", color: "#6366f1", textDecoration: "none" }}>View all →</Link>
          </div>
          <MiniChart data={history} />
        </div>
      )}

      {/* Tools */}
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "1rem" }}>
        All tools
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {TOOLS.map(t => (
          <Link key={t.to} to={t.to} style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1rem 1.25rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, cursor: "pointer" }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: t.color + "18", border: `1px solid ${t.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", flexShrink: 0 }}>
                {t.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: "white", marginBottom: "0.25rem" }}>{t.title}</div>
                <div style={{ fontSize: "0.75rem", color: "#6b7280", lineHeight: 1.5 }}>{t.desc}</div>
              </div>
              <span style={{ fontSize: "0.72rem", color: t.color, fontWeight: 600, flexShrink: 0, marginTop: "0.2rem", whiteSpace: "nowrap" }}>{t.cta}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function MiniChart({ data }) {
  const items = [...data].reverse().slice(-14);
  const max = Math.max(...items.map(h => h.quality_score), 10);
  const sc = s => s >= 8 ? "#10b981" : s >= 6 ? "#6366f1" : s >= 4 ? "#f59e0b" : "#ef4444";
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: "48px" }}>
      {items.map((h, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
          <div style={{ fontSize: "0.48rem", color: "#374151" }}>{h.quality_score?.toFixed(1)}</div>
          <div style={{ width: "100%", height: `${(h.quality_score / max) * 100}%`, background: sc(h.quality_score), borderRadius: "2px 2px 0 0", minHeight: 3 }} />
        </div>
      ))}
    </div>
  );
}
