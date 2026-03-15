import React, { useState } from "react";
import { analyzeGithub, chatWithCode } from "../api";
import QualityScore from "../components/QualityScore";

export default function GithubPage() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [question, setQuestion] = useState("");
  const [chatAnswer, setChatAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await analyzeGithub(url.trim());
      if (res.data.error) setError(res.data.error);
      else setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    }
    setLoading(false);
  };

  const handleChat = async () => {
    if (!question.trim() || !result?.session_id) return;
    setChatLoading(true);
    try {
      const res = await chatWithCode(result.session_id, question);
      setChatAnswer(res.data.answer);
    } catch (e) {
      setChatAnswer("Error: " + (e.response?.data?.detail || e.message));
    }
    setChatLoading(false);
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div className="glass" style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🐙</div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>GitHub Analyzer</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "4px 0 0" }}>Clone any public repo and run full AI analysis</p>
        </div>
      </div>

      <div className="glass" style={{ borderRadius: "20px", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <input value={url} onChange={e => setUrl(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAnalyze()}
            placeholder="https://github.com/username/repository"
            style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "10px 16px", color: "#e5e7eb", fontSize: "0.875rem", outline: "none" }} />
          <button onClick={handleAnalyze} disabled={loading || !url.trim()}
            style={{ padding: "10px 24px", background: loading || !url.trim() ? "#1e3a5f" : "linear-gradient(135deg,#2563eb,#7c3aed)", border: "none", borderRadius: "12px", color: "white", fontWeight: 600, fontSize: "0.875rem", cursor: loading || !url.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
            {loading ? "Analyzing..." : "Analyze Repo →"}
          </button>
        </div>
        {error && <p style={{ color: "#f87171", fontSize: "0.875rem", marginTop: "0.75rem" }}>{error}</p>}
      </div>

      {result && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
            <StatCard label="Files Analyzed" value={result.files_analyzed} color="#3b82f6" />
            <StatCard label="Avg Quality" value={`${result.avg_quality_score}/10`} color="#10b981" />
            <StatCard label="Session ID" value={result.session_id} color="#8b5cf6" />
          </div>

          <div className="glass" style={{ borderRadius: "20px", padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ fontWeight: 600, marginBottom: "1rem", color: "#e5e7eb" }}>💬 Chat with this Codebase</h3>
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <input value={question} onChange={e => setQuestion(e.target.value)} onKeyDown={e => e.key === "Enter" && handleChat()}
                placeholder="Where is authentication implemented?"
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "8px 14px", color: "#e5e7eb", fontSize: "0.875rem", outline: "none" }} />
              <button onClick={handleChat} disabled={chatLoading || !question.trim()}
                style={{ padding: "8px 20px", background: "#2563eb", border: "none", borderRadius: "10px", color: "white", fontSize: "0.875rem", cursor: "pointer" }}>
                {chatLoading ? "..." : "Ask"}
              </button>
            </div>
            {chatAnswer && <pre style={{ fontSize: "0.8rem", color: "#d1d5db", whiteSpace: "pre-wrap", background: "rgba(255,255,255,0.03)", borderRadius: "10px", padding: "1rem" }}>{chatAnswer}</pre>}
          </div>

          <div>
            {Object.entries(result.results).map(([filename, data]) => (
              <FileCard key={filename} filename={filename} data={data} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="glass" style={{ borderRadius: "14px", padding: "1rem", textAlign: "center" }}>
      <div style={{ fontSize: "1.4rem", fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "4px" }}>{label}</div>
    </div>
  );
}

function FileCard({ filename, data }) {
  const [open, setOpen] = useState(false);
  const score = data.quality?.score;
  const scoreColor = score >= 8 ? "#10b981" : score >= 6 ? "#3b82f6" : score >= 4 ? "#f59e0b" : "#ef4444";
  return (
    <div className="glass" style={{ borderRadius: "14px", overflow: "hidden", marginBottom: "0.75rem" }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", background: "transparent", border: "none", cursor: "pointer", color: "white" }}>
        <span style={{ fontFamily: "monospace", fontSize: "0.875rem", color: "#93c5fd" }}>{filename}</span>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {score !== undefined && <span style={{ fontWeight: 700, color: scoreColor }}>{score}/10</span>}
          <span style={{ color: "#6b7280", fontSize: "0.75rem" }}>{open ? "▲" : "▼"}</span>
        </div>
      </button>
      {open && (
        <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {data.error && <p style={{ color: "#f87171", fontSize: "0.75rem" }}>{data.error}</p>}
          <QualityScore quality={data.quality} />
          {data.ai_bugs && <pre style={{ fontSize: "0.75rem", color: "#d1d5db", whiteSpace: "pre-wrap" }}>{data.ai_bugs}</pre>}
        </div>
      )}
    </div>
  );
}
