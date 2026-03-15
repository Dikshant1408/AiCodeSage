import React, { useState } from "react";
import Editor from "@monaco-editor/react";
import { debugError } from "../api";

const EXAMPLES = [
  "TypeError: 'NoneType' object is not iterable",
  "IndexError: list index out of range",
  "KeyError: 'user_id'",
  "RecursionError: maximum recursion depth exceeded",
];

export default function DebugPage() {
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  const handleDebug = async () => {
    if (!error.trim()) return;
    setLoading(true); setApiError(null);
    try {
      const res = await debugError(error, code);
      setResult(res.data.explanation);
    } catch (e) {
      setApiError(e.response?.data?.detail || e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div className="glass" style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🐛</div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>AI Debugger</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "4px 0 0" }}>Paste any error — AI explains the cause and gives a step-by-step fix</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="glass" style={{ borderRadius: "16px", padding: "1.25rem" }}>
            <label style={{ fontSize: "0.75rem", color: "#9ca3af", display: "block", marginBottom: "0.5rem" }}>Error Message</label>
            <textarea value={error} onChange={e => setError(e.target.value)}
              placeholder="Paste your error traceback here..."
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "10px", color: "#fca5a5", fontSize: "0.875rem", resize: "vertical", minHeight: "120px", outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginTop: "0.5rem" }}>
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => setError(ex)}
                  style={{ padding: "3px 10px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "999px", color: "#f87171", fontSize: "0.7rem", cursor: "pointer" }}>
                  {ex.split(':')[0]}
                </button>
              ))}
            </div>
          </div>

          <div className="glass" style={{ borderRadius: "20px", overflow: "hidden" }}>
            <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.75rem", color: "#6b7280" }}>Related code (optional)</div>
            <Editor height="220px" defaultLanguage="python" theme="vs-dark" value={code}
              onChange={(v) => setCode(v || "")}
              options={{ fontSize: 13, minimap: { enabled: false }, padding: { top: 8 }, fontFamily: "monospace" }} />
          </div>

          <button onClick={handleDebug} disabled={loading || !error.trim()}
            style={{ padding: "13px", background: loading || !error.trim() ? "#1e3a5f" : "linear-gradient(135deg,#dc2626,#7c3aed)", border: "none", borderRadius: "12px", color: "white", fontWeight: 600, cursor: loading || !error.trim() ? "not-allowed" : "pointer" }}>
            {loading ? "Debugging..." : "Debug This Error →"}
          </button>
        </div>

        <div className="glass" style={{ borderRadius: "20px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: "0.875rem", color: "#d1d5db" }}>AI Explanation</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", maxHeight: "520px" }}>
            {apiError && <div style={{ padding: "1rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: "12px", color: "#fca5a5", fontSize: "0.875rem" }}>{apiError}</div>}
            {!result && !apiError && !loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "4rem 0", color: "#4b5563", textAlign: "center" }}>
                <div className="float" style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.4 }}>🐛</div>
                <p style={{ fontSize: "0.875rem" }}>Paste an error message and click Debug</p>
              </div>
            )}
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "4rem 0" }}>
                <div style={{ width: 40, height: 40, border: "3px solid #1e3a5f", borderTop: "3px solid #ef4444", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
                <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Analyzing error...</p>
              </div>
            )}
            {result && <pre style={{ fontSize: "0.875rem", color: "#d1d5db", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{result}</pre>}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
