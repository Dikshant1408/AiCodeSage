import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { autoFix } from "../api";

export default function AutoFixPage() {
  const [code, setCode] = useState("# Paste code with an issue here\n");
  const [issue, setIssue] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFix = async () => {
    if (!issue.trim()) return;
    setLoading(true); setError(null);
    try {
      const res = await autoFix(code, issue);
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div className="glass" style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🔧</div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>AI Auto-Fix</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "4px 0 0" }}>Describe the issue and AI generates a fix patch</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="glass" style={{ borderRadius: "20px", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ef4444" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#f59e0b" }} />
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#10b981" }} />
              <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#6b7280", fontFamily: "monospace" }}>code with issue</span>
            </div>
            <Editor height="360px" defaultLanguage="python" theme="vs-dark" value={code}
              onChange={(v) => setCode(v || "")}
              options={{ fontSize: 14, minimap: { enabled: false }, padding: { top: 12 }, fontFamily: "monospace" }} />
          </div>

          <div className="glass" style={{ borderRadius: "16px", padding: "1rem" }}>
            <label style={{ fontSize: "0.75rem", color: "#9ca3af", display: "block", marginBottom: "0.5rem" }}>Describe the issue to fix</label>
            <textarea value={issue} onChange={e => setIssue(e.target.value)}
              placeholder="e.g. Unused variable 'temp' on line 5, SQL injection risk in query, function too complex..."
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", padding: "10px", color: "#e5e7eb", fontSize: "0.875rem", resize: "vertical", minHeight: "80px", outline: "none", fontFamily: "inherit", boxSizing: "border-box" }} />
            <button onClick={handleFix} disabled={loading || !issue.trim()}
              style={{ width: "100%", marginTop: "0.75rem", padding: "12px", background: loading || !issue.trim() ? "#1e3a5f" : "linear-gradient(135deg,#2563eb,#7c3aed)", border: "none", borderRadius: "12px", color: "white", fontWeight: 600, cursor: loading || !issue.trim() ? "not-allowed" : "pointer" }}>
              {loading ? "Generating fix..." : "Generate Fix →"}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="glass" style={{ borderRadius: "20px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.875rem", color: "#d1d5db" }}>AI Fix Patch</span>
            {result && <span style={{ fontSize: "0.75rem", color: "#34d399" }}>✓ Fix generated</span>}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", maxHeight: "520px" }}>
            {error && <div style={{ padding: "1rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: "12px", color: "#fca5a5", fontSize: "0.875rem" }}>{error}</div>}
            {!result && !error && !loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "4rem 0", color: "#4b5563", textAlign: "center" }}>
                <div className="float" style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.4 }}>🔧</div>
                <p style={{ fontSize: "0.875rem" }}>Paste code, describe the issue, click Generate Fix</p>
              </div>
            )}
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "4rem 0" }}>
                <div style={{ width: 40, height: 40, border: "3px solid #1e3a5f", borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
                <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>AI is generating fix...</p>
              </div>
            )}
            {result && (
              <>
                <div style={{ fontSize: "0.7rem", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Issue: {result.original_issue}</div>
                <pre style={{ fontSize: "0.8rem", color: "#d1d5db", whiteSpace: "pre-wrap", fontFamily: "monospace", lineHeight: 1.6 }}>
                  {result.fix?.split('\n').map((line, i) => {
                    const color = line.startsWith('+') ? "#34d399" : line.startsWith('-') ? "#f87171" : line.startsWith('@@') ? "#93c5fd" : "#d1d5db";
                    return <span key={i} style={{ color, display: "block" }}>{line}</span>;
                  })}
                </pre>
              </>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
