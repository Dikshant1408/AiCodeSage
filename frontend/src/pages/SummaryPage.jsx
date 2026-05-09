import React, { useState } from "react";
import { summarizeZip, summarizeGithub } from "../api";

const LANG_COLOR = { python:"#3b82f6", javascript:"#f59e0b", typescript:"#6366f1",
                     java:"#ef4444", css:"#10b981", html:"#f97316", sql:"#8b5cf6",
                     jsx:"#f59e0b", tsx:"#6366f1", md:"#9ca3af", json:"#6b7280" };

function parseSection(text, key) {
  if (!text) return "";
  const lines = text.split("\n");
  let capturing = false;
  const result = [];
  const allHeaders = ["WHAT IT IS", "WHAT IT DOES", "HOW IT WORKS", "WHAT IT COULD BECOME"];
  const headerPat = new RegExp(`^[\\*\\s]*(${allHeaders.join("|")})[\\*\\s]*:?\\s*$`, "i");
  const thisPat   = new RegExp(`^[\\*\\s]*${key}[\\*\\s]*:?\\s*$`, "i");

  for (const line of lines) {
    if (thisPat.test(line.trim()))  { capturing = true; continue; }
    if (headerPat.test(line.trim()) && capturing) break;
    if (capturing) result.push(line);
  }
  return result.join("\n").replace(/\*\*/g, "").trim();
}

export default function SummaryPage() {
  const [mode, setMode]       = useState("zip");
  const [file, setFile]       = useState(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const run = async () => {
    const cleanGithubUrl = githubUrl.trim();
    setLoading(true); setError(null); setResult(null);
    try {
      const res = mode === "zip"
        ? await summarizeZip(file)
        : await summarizeGithub(cleanGithubUrl);
      if (res.data.error) setError(res.data.error);
      else setResult(res.data);
    } catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  };

  const summary = result?.summary || "";
  const whatItIs    = parseSection(summary, "WHAT IT IS");
  const whatItDoes  = parseSection(summary, "WHAT IT DOES");
  const howItWorks  = parseSection(summary, "HOW IT WORKS");
  const whatItCould = parseSection(summary, "WHAT IT COULD BECOME");
  const showRaw     = !whatItIs && !whatItDoes && summary.length > 10;

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: "2.5rem 2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.8rem", fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Project Summary
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.85rem" }}>
          Upload a ZIP or paste a GitHub URL — get a plain English explanation of what the project is, what it does, how it works, and what it could become.
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

        <button onClick={run} disabled={loading || (mode === "zip" ? !file : !githubUrl.trim())}
          style={{ marginTop: "1rem", padding: "11px 28px", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer", background: loading ? "rgba(99,102,241,0.15)" : "linear-gradient(135deg,#4f46e5,#7c3aed)", color: loading ? "#6b7280" : "white" }}>
          {loading ? "Reading project..." : "Summarize Project →"}
        </button>

        {error && <div style={{ marginTop: "1rem", padding: "0.875rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 10, color: "#fca5a5", fontSize: "0.82rem" }}>{error}</div>}
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "0.85rem" }}>Reading your project...</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div>
          {/* Project name + stack */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem", flexWrap: "wrap" }}>
            <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#e5e7eb" }}>{result.repo_name}</h2>
            <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>{result.file_count} files · {result.total_lines?.toLocaleString()} lines</span>
            {result.stack?.map(tech => (
              <span key={tech} style={{ fontSize: "0.72rem", padding: "2px 9px", borderRadius: 5, background: `${LANG_COLOR[tech.toLowerCase()] || "#6b7280"}18`, color: LANG_COLOR[tech.toLowerCase()] || "#9ca3af", border: `1px solid ${LANG_COLOR[tech.toLowerCase()] || "#6b7280"}33` }}>{tech}</span>
            ))}
          </div>

          {/* Summary sections */}
          {showRaw ? (
            <p style={{ fontSize: "0.9rem", color: "#d1d5db", lineHeight: 1.7 }}>{summary.replace(/\*\*/g, "")}</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {whatItIs && (
                <div>
                  <div style={{ fontSize: "0.6rem", color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "0.4rem" }}>What it is</div>
                  <p style={{ margin: 0, fontSize: "1.05rem", color: "#e5e7eb", fontWeight: 500, lineHeight: 1.5 }}>{whatItIs}</p>
                </div>
              )}
              {whatItDoes && (
                <div>
                  <div style={{ fontSize: "0.6rem", color: "#3b82f6", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "0.4rem" }}>What it does</div>
                  <p style={{ margin: 0, fontSize: "0.92rem", color: "#9ca3af", lineHeight: 1.7 }}>{whatItDoes}</p>
                </div>
              )}
              {howItWorks && (
                <div>
                  <div style={{ fontSize: "0.6rem", color: "#8b5cf6", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "0.4rem" }}>How it works</div>
                  <p style={{ margin: 0, fontSize: "0.92rem", color: "#9ca3af", lineHeight: 1.7 }}>{howItWorks}</p>
                </div>
              )}
              {whatItCould && (
                <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12, padding: "1.1rem 1.25rem" }}>
                  <div style={{ fontSize: "0.6rem", color: "#10b981", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "0.4rem" }}>What it could become</div>
                  <p style={{ margin: 0, fontSize: "0.92rem", color: "#6ee7b7", lineHeight: 1.7 }}>{whatItCould}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
