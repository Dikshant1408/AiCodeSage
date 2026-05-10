import React, { useState } from "react";
import { summarizeZip, summarizeGithub } from "../api";
import NextSteps from "../components/NextSteps";

const LANG_COLOR = { python:"#3b82f6", javascript:"#f59e0b", typescript:"#6366f1",
                     java:"#ef4444", css:"#10b981", html:"#f97316", sql:"#8b5cf6",
                     jsx:"#f59e0b", tsx:"#6366f1", react:"#61dafb", fastapi:"#009688",
                     nextjs:"#ffffff", flask:"#9ca3af", django:"#10b981" };

const ALL_HEADERS = ["WHAT IT IS", "WHAT IT DOES", "HOW IT WORKS", "CURRENT STATE", "WHAT IT COULD BECOME"];

function parseSection(text, key) {
  if (!text) return "";
  const lines = text.split("\n");
  let capturing = false;
  const result = [];
  const headerPat = new RegExp(`^[\\*#\\s]*(${ALL_HEADERS.join("|")})[\\*#\\s]*:?\\s*$`, "i");
  const thisPat   = new RegExp(`^[\\*#\\s]*${key.replace(/[()]/g, "\\$&")}[\\*#\\s]*:?\\s*$`, "i");
  for (const line of lines) {
    if (thisPat.test(line.trim()))  { capturing = true; continue; }
    if (headerPat.test(line.trim()) && capturing) break;
    if (capturing) result.push(line);
  }
  return result.join("\n").replace(/\*\*/g, "").replace(/##/g, "").trim();
}

const SECTIONS = [
  { key: "WHAT IT IS",          label: "What it is",          color: "#6366f1", size: "1.05rem", weight: 600, textColor: "#e5e7eb", bg: null },
  { key: "WHAT IT DOES",        label: "What it does",        color: "#3b82f6", size: "0.92rem", weight: 400, textColor: "#c7d2fe", bg: null },
  { key: "HOW IT WORKS",        label: "How it works",        color: "#8b5cf6", size: "0.92rem", weight: 400, textColor: "#d1d5db", bg: null },
  { key: "CURRENT STATE",       label: "Current state",       color: "#f59e0b", size: "0.92rem", weight: 400, textColor: "#fcd34d", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)" },
  { key: "WHAT IT COULD BECOME",label: "What it could become",color: "#10b981", size: "0.92rem", weight: 400, textColor: "#6ee7b7", bg: "rgba(16,185,129,0.06)", border: "rgba(16,185,129,0.2)" },
];

export default function SummaryPage() {
  const [mode, setMode]           = useState("zip");
  const [file, setFile]           = useState(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = mode === "zip"
        ? await summarizeZip(file)
        : await summarizeGithub(githubUrl);
      if (res.data.error) setError(res.data.error);
      else setResult(res.data);
    } catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  };

  const summary = result?.summary || "";
  const parsed  = SECTIONS.map(s => ({ ...s, text: parseSection(summary, s.key) }));
  const hasAny  = parsed.some(s => s.text);
  const showRaw = !hasAny && summary.length > 10;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "2.5rem 2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.8rem", fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Project Summary
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.85rem" }}>
          Upload a ZIP or paste a GitHub URL — get a full plain-English explanation of what the project is, what it does, how it works, its current state, and what it could become.
        </p>
      </div>

      {/* Input */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {["zip", "github"].map(m => (
            <button key={m} onClick={() => { setMode(m); setResult(null); setError(null); }}
              style={{ padding: "7px 18px", borderRadius: 8, border: `1px solid ${mode === m ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`, background: mode === m ? "rgba(99,102,241,0.15)" : "transparent", color: mode === m ? "#a5b4fc" : "#6b7280", fontSize: "0.82rem", fontWeight: mode === m ? 700 : 400, cursor: "pointer" }}>
              {m === "zip" ? "📦 Upload ZIP" : "🐙 GitHub URL"}
            </button>
          ))}
        </div>

        {mode === "zip" ? (
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <input type="file" accept=".zip" id="sum-zip" style={{ display: "none" }} onChange={e => { setFile(e.target.files[0]); setResult(null); }} />
            <label htmlFor="sum-zip" style={{ padding: "9px 20px", borderRadius: 9, cursor: "pointer", fontSize: "0.82rem", color: file ? "#34d399" : "#9ca3af", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {file ? `✓ ${file.name}` : "Choose ZIP file"}
            </label>
            <span style={{ fontSize: "0.72rem", color: "#4b5563" }}>Any language — skips node_modules, venv, dist</span>
          </div>
        ) : (
          <input value={githubUrl} onChange={e => setGithubUrl(e.target.value)}
            placeholder="https://github.com/username/repo"
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "10px 14px", color: "#e5e7eb", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
        )}

        <button onClick={run} disabled={loading || (mode === "zip" ? !file : !githubUrl)}
          style={{ marginTop: "1rem", padding: "11px 28px", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer", background: loading ? "rgba(99,102,241,0.15)" : "linear-gradient(135deg,#4f46e5,#7c3aed)", color: loading ? "#6b7280" : "white" }}>
          {loading ? "Reading project..." : "Summarize Project →"}
        </button>

        {error && <div style={{ marginTop: "1rem", padding: "0.875rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 10, color: "#fca5a5", fontSize: "0.82rem" }}>{error}</div>}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "0.85rem" }}>Reading your project and writing the summary...</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          {/* Project name + meta */}
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: "#e5e7eb" }}>{result.repo_name}</h2>
              <span style={{ fontSize: "0.72rem", color: "#4b5563" }}>{result.file_count} files · {result.total_lines?.toLocaleString()} lines of code</span>
            </div>
            {result.stack?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {result.stack.map(tech => (
                  <span key={tech} style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: 6, background: `${LANG_COLOR[tech.toLowerCase()] || "#6b7280"}18`, color: LANG_COLOR[tech.toLowerCase()] || "#9ca3af", border: `1px solid ${LANG_COLOR[tech.toLowerCase()] || "#6b7280"}33` }}>{tech}</span>
                ))}
              </div>
            )}
          </div>

          {/* Sections */}
          {showRaw ? (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1.5rem" }}>
              <p style={{ margin: 0, fontSize: "0.92rem", color: "#d1d5db", lineHeight: 1.8 }}>{summary.replace(/\*\*/g, "").replace(/##/g, "")}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {parsed.map((s, i) => {
                if (!s.text) return null;
                const isHighlighted = !!s.bg;
                return (
                  <div key={s.key} style={{
                    padding: "1.5rem",
                    background: s.bg || (i % 2 === 0 ? "rgba(255,255,255,0.02)" : "transparent"),
                    border: isHighlighted ? `1px solid ${s.border}` : "none",
                    borderTop: i > 0 && !isHighlighted ? "1px solid rgba(255,255,255,0.05)" : (isHighlighted ? `1px solid ${s.border}` : "none"),
                    borderRadius: isHighlighted ? 14 : 0,
                    marginTop: isHighlighted ? "0.75rem" : 0,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem" }}>
                      <div style={{ width: 3, height: 18, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: "0.65rem", color: s.color, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700 }}>{s.label}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: s.size, fontWeight: s.weight, color: s.textColor, lineHeight: 1.8 }}>{s.text}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {result && <NextSteps context="summary" />}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
