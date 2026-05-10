import React, { useState } from "react";
import { chatWithCode } from "../api";
import axios from "axios";
import NextSteps from "../components/NextSteps";
import { saveLastAnalysis } from "../lib/lastAnalysis";

const BASE = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api`;

// Use the fast repo analyze endpoint instead of the slow per-file pipeline
const analyzeGithubFast = (repo_url) => axios.post(`${BASE}/repo/analyze-github`, { repo_url });
const summarizeGithub   = (repo_url) => axios.post(`${BASE}/summary/github`,       { repo_url });

const sc = s => s >= 8 ? "#10b981" : s >= 6 ? "#6366f1" : s >= 4 ? "#f59e0b" : "#ef4444";

export default function GithubPage() {
  const [url, setUrl]           = useState("");
  const [result, setResult]     = useState(null);
  const [summary, setSummary]   = useState(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [question, setQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [sessionId, setSessionId]   = useState(null);
  const [activeTab, setActiveTab]   = useState("overview");

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(null); setResult(null); setSummary(null); setChatAnswer("");

    try {
      // Run analysis + summary in parallel
      const [analysisRes, summaryRes] = await Promise.allSettled([
        analyzeGithubFast(url.trim()),
        summarizeGithub(url.trim()),
      ]);

      if (analysisRes.status === "fulfilled") {
        const d = analysisRes.value.data;
        if (d.error) setError(d.error);
        else {
          setResult(d);
        saveLastAnalysis({ tool: "github", repo_name: d.repo_name || githubUrl.split("/").pop(), files: d.total_files, score: d.avg_quality_score });
          // Index for chat via the old github endpoint
          try {
            const chatRes = await axios.post(`${BASE}/github/`, { repo_url: url.trim() });
            if (chatRes.data.session_id) setSessionId(chatRes.data.session_id);
          } catch {}
        }
      } else {
        setError(analysisRes.reason?.response?.data?.detail || "Failed to analyze repo");
      }

      if (summaryRes.status === "fulfilled" && !summaryRes.value.data.error) {
        setSummary(summaryRes.value.data);
      }
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    }
    setLoading(false);
  };

  const handleChat = async () => {
    if (!question.trim() || !sessionId) return;
    setChatLoading(true);
    try {
      const res = await chatWithCode(sessionId, question);
      setChatAnswer(res.data.answer);
    } catch (e) {
      setChatAnswer("Error: " + (e.response?.data?.detail || e.message));
    }
    setChatLoading(false);
  };

  const parseSummarySection = (text, key) => {
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
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.75rem" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(107,114,128,0.15)", border: "1px solid rgba(107,114,128,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>🐙</div>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 800, color: "#e5e7eb" }}>GitHub Chat</h1>
          <p style={{ margin: "3px 0 0", color: "#6b7280", fontSize: "0.82rem" }}>Paste a public GitHub URL — get a full analysis and ask questions about the codebase</p>
        </div>
      </div>

      {/* URL input */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAnalyze()}
            placeholder="https://github.com/username/repository"
            style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 16px", color: "#e5e7eb", fontSize: "0.875rem", outline: "none" }} />
          <button onClick={handleAnalyze} disabled={loading || !url.trim()}
            style={{ padding: "10px 24px", background: loading || !url.trim() ? "rgba(99,102,241,0.15)" : "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 10, color: loading || !url.trim() ? "#6b7280" : "white", fontWeight: 600, fontSize: "0.875rem", cursor: loading || !url.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
            {loading ? "Analyzing..." : "Analyze →"}
          </button>
        </div>
        {error && <p style={{ color: "#f87171", fontSize: "0.82rem", marginTop: "0.75rem", margin: "0.75rem 0 0" }}>{error}</p>}
        <p style={{ margin: "0.5rem 0 0", fontSize: "0.72rem", color: "#4b5563" }}>Public repos only. Clones the repo, runs static analysis, indexes for chat. Takes ~20s.</p>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
          <div style={{ width: 40, height: 40, border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "0.85rem" }}>Cloning repo, running analysis, indexing for chat...</p>
        </div>
      )}

      {result && (
        <div>
          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", marginBottom: "1.5rem" }}>
            {["overview", "files", "chat"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "0.75rem 1.25rem", background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent", color: activeTab === tab ? "#a5b4fc" : "#6b7280", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{tab}</button>
            ))}
          </div>

          {/* Overview tab */}
          {activeTab === "overview" && (
            <div>
              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.5rem" }}>
                {[["Files", result.total_files, "#6366f1"], ["Functions", result.total_functions, "#8b5cf6"], ["Lines", result.total_lines?.toLocaleString(), "#3b82f6"], ["Avg Score", `${result.avg_quality_score}/10`, sc(result.avg_quality_score)]].map(([l, v, c]) => (
                  <div key={l} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1rem", textAlign: "center" }}>
                    <div style={{ fontSize: "1.4rem", fontWeight: 800, color: c }}>{v}</div>
                    <div style={{ fontSize: "0.65rem", color: "#6b7280", marginTop: "2px" }}>{l}</div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              {summary && (
                <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 14, padding: "1.25rem", marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "0.65rem", color: "#6366f1", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "1rem" }}>About this project</div>
                  {["WHAT IT IS", "WHAT IT DOES", "HOW IT WORKS", "WHAT IT COULD BECOME"].map(key => {
                    const text = parseSummarySection(summary.summary, key);
                    if (!text) return null;
                    const colors = { "WHAT IT IS": "#e5e7eb", "WHAT IT DOES": "#9ca3af", "HOW IT WORKS": "#9ca3af", "WHAT IT COULD BECOME": "#6ee7b7" };
                    const labels = { "WHAT IT IS": "What it is", "WHAT IT DOES": "What it does", "HOW IT WORKS": "How it works", "WHAT IT COULD BECOME": "What it could become" };
                    return (
                      <div key={key} style={{ marginBottom: "0.875rem" }}>
                        <div style={{ fontSize: "0.6rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.25rem" }}>{labels[key]}</div>
                        <p style={{ margin: 0, fontSize: "0.85rem", color: colors[key], lineHeight: 1.6 }}>{text}</p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Riskiest files */}
              {result.riskiest_files?.length > 0 && (
                <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, padding: "1rem" }}>
                  <div style={{ fontSize: "0.65rem", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>⚠ Riskiest Files</div>
                  {result.riskiest_files.map((f, i) => (
                    <div key={i} style={{ fontSize: "0.78rem", color: "#fca5a5", fontFamily: "monospace", marginBottom: "0.25rem" }}>{i + 1}. {f}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Files tab */}
          {activeTab === "files" && (
            <div>
              {result.file_scores?.map((fs, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.55rem 0.875rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, marginBottom: "0.3rem" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#93c5fd", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fs.file}</span>
                  <span style={{ fontSize: "0.62rem", color: "#6b7280" }}>{fs.lang}</span>
                  <span style={{ fontWeight: 700, fontSize: "0.8rem", color: sc(fs.score) }}>{fs.score}/10</span>
                  <span style={{ fontSize: "0.65rem", color: "#6b7280", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4 }}>{fs.grade}</span>
                </div>
              ))}
            </div>
          )}

          {/* Chat tab */}
          {activeTab === "chat" && (
            <div>
              {!sessionId && (
                <div style={{ padding: "1rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, marginBottom: "1rem", fontSize: "0.82rem", color: "#fcd34d" }}>
                  Chat indexing in progress... wait a moment then try asking a question.
                </div>
              )}
              <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem" }}>
                <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === "Enter" && handleChat()}
                  placeholder="Where is authentication implemented? How does the API work?"
                  style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#e5e7eb", fontSize: "0.875rem", outline: "none" }} />
                <button onClick={handleChat} disabled={chatLoading || !question.trim()}
                  style={{ padding: "10px 20px", background: chatLoading ? "rgba(99,102,241,0.15)" : "#4f46e5", border: "none", borderRadius: 10, color: chatLoading ? "#6b7280" : "white", fontSize: "0.875rem", cursor: "pointer", fontWeight: 600 }}>
                  {chatLoading ? "..." : "Ask"}
                </button>
              </div>
              {chatAnswer && (
                <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1.25rem" }}>
                  <pre style={{ fontSize: "0.82rem", color: "#d1d5db", whiteSpace: "pre-wrap", margin: 0, lineHeight: 1.6 }}>{chatAnswer}</pre>
                </div>
              )}
              <div style={{ marginTop: "1rem" }}>
                <div style={{ fontSize: "0.65rem", color: "#4b5563", marginBottom: "0.5rem" }}>Try asking:</div>
                {["Where is authentication handled?", "How does the API connect to the database?", "What are the main components?", "Where are environment variables used?"].map(q => (
                  <button key={q} onClick={() => setQuestion(q)} style={{ display: "block", width: "100%", textAlign: "left", padding: "6px 10px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 7, color: "#6b7280", fontSize: "0.75rem", cursor: "pointer", marginBottom: "0.3rem" }}>{q}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {result && <NextSteps context="github" />}
    </div>
  );
}
