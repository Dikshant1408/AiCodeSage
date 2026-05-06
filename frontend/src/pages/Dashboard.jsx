import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getHistory } from "../api";

const TOOLS = [
  {
    to: "/summary",
    icon: "💬",
    title: "Project Summary",
    desc: "Upload a ZIP or paste a GitHub URL. Get a plain English explanation of what the project is, what it does, how it works, and what it could become.",
    color: "#a78bfa",
    cta: "Summarize →",
  },
  {
    to: "/repo",
    icon: "📋",
    title: "Project Report",
    desc: "Upload your project ZIP or GitHub URL. Get a full report: what the project is, every issue with exact file and line, how to fix each one, and what to build next. Export to Markdown.",
    color: "#6366f1",
    cta: "Start here →",
  },
  {
    to: "/pipeline",
    icon: "⚡",
    title: "Auto Fix Pipeline",
    desc: "Paste your files. The system finds the worst issues, generates fixes using AI, then re-runs static analysis to verify the fixes actually improved the score.",
    color: "#8b5cf6",
    cta: "Run pipeline →",
  },
  {
    to: "/security",
    icon: "⬢",
    title: "Security Scan",
    desc: "Finds SQL injection, hardcoded secrets, unsafe eval. Traces exactly how user input flows through your code to a dangerous function — across file boundaries.",
    color: "#ef4444",
    cta: "Scan code →",
  },
  {
    to: "/dependencies",
    icon: "🔒",
    title: "CVE Scanner",
    desc: "Paste your requirements.txt or package.json. Checks every dependency against the live OSV vulnerability database and shows which versions have known CVEs.",
    color: "#dc2626",
    cta: "Check deps →",
  },
  {
    to: "/review",
    icon: "◈",
    title: "Code Review",
    desc: "Paste any code snippet. Get a quality score (0–10), bug list from static analysis, and a per-function review. Good for reviewing a single file quickly.",
    color: "#3b82f6",
    cta: "Review code →",
  },
  {
    to: "/github",
    icon: "🐙",
    title: "GitHub Chat",
    desc: "Paste a public GitHub URL. The repo gets cloned, indexed into a vector database, and you can ask questions like 'where is authentication handled?' or 'how does the payment flow work?'",
    color: "#6b7280",
    cta: "Chat with repo →",
  },
  {
    to: "/analytics",
    icon: "📈",
    title: "Quality History",
    desc: "Every time you analyze a project, the quality score is saved. Come back later and see if your codebase is improving or getting worse over time.",
    color: "#0ea5e9",
    cta: "View history →",
  },
];

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  useEffect(() => {
    getHistory("demo-project", 10).then(r => setHistory(r.data.history || [])).catch(() => {});
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "3rem 2rem" }}>
      {/* Hero */}
      <div style={{ marginBottom: "3rem" }}>
        <h1 style={{ margin: "0 0 0.75rem", fontSize: "2.2rem", fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          AiCodeSage
        </h1>
        <p style={{ margin: "0 0 1.5rem", fontSize: "1rem", color: "#9ca3af", lineHeight: 1.6, maxWidth: 600 }}>
          Upload your project and get a full developer report — what it is, every bug with exact location and fix, security vulnerabilities, and what to improve next. Export it and work from it.
        </p>
        <Link to="/repo">
          <button style={{ padding: "12px 28px", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, cursor: "pointer", fontSize: "0.95rem" }}>
            📋 Analyze My Project →
          </button>
        </Link>
      </div>

      {/* Quality history if exists */}
      {history.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.1rem", marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "0.78rem", color: "#9ca3af", fontWeight: 600 }}>Quality Score History</span>
            <Link to="/analytics" style={{ fontSize: "0.72rem", color: "#6366f1", textDecoration: "none" }}>View all →</Link>
          </div>
          <MiniChart data={history} />
        </div>
      )}

      {/* Tools */}
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "1rem" }}>
        What you can do
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {TOOLS.map(t => (
          <Link key={t.to} to={t.to} style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "1.1rem 1.25rem", background: "rgba(255,255,255,0.02)", border: `1px solid rgba(255,255,255,0.06)`, borderRadius: 14, transition: "border-color 0.15s, background 0.15s", cursor: "pointer" }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: t.color + "18", border: `1px solid ${t.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem", flexShrink: 0 }}>
                {t.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "white", marginBottom: "0.3rem" }}>{t.title}</div>
                <div style={{ fontSize: "0.78rem", color: "#6b7280", lineHeight: 1.5 }}>{t.desc}</div>
              </div>
              <span style={{ fontSize: "0.75rem", color: t.color, fontWeight: 600, flexShrink: 0, marginTop: "0.2rem", whiteSpace: "nowrap" }}>{t.cta}</span>
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
