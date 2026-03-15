import React, { useState } from "react";
import axios from "axios";

const BASE = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api`;
const EXAMPLE = `def find_duplicates(items):
    duplicates = []
    for i in range(len(items)):
        for j in range(len(items)):
            if i != j and items[i] == items[j]:
                if items[i] not in duplicates:
                    duplicates.append(items[i])
    return duplicates

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)

def load_all_users(db):
    users = []
    ids = db.get_all_ids()
    for uid in ids:
        user = db.get_user(uid)
        users.append(user)
    return users
`;

const ISSUE_COLOR = { critical: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };

export default function PerformancePage() {
  const [code, setCode] = useState(EXAMPLE);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleAnalyze = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await axios.post(`${BASE}/extras/performance`, { code });
      setResult(res.data);
    } catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div className="glass" style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>⚡</div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Performance Analyzer</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "4px 0 0" }}>Detect O(n²) loops, expensive recursion, N+1 queries, memory leaks</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="glass" style={{ borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "7px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.7rem", color: "#6b7280" }}>Code to Analyze</div>
            <textarea value={code} onChange={e => setCode(e.target.value)}
              style={{ width: "100%", minHeight: "380px", background: "#1e1e1e", border: "none", padding: "1rem", color: "#d4d4d4", fontSize: "0.8rem", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          </div>
          <button onClick={handleAnalyze} disabled={loading}
            style={{ padding: "13px", background: loading ? "#1e3a5f" : "linear-gradient(135deg,#f97316,#7c3aed)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Analyzing performance..." : "⚡ Analyze Performance →"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && <div style={{ padding: "1rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 12, color: "#fca5a5", fontSize: "0.875rem" }}>{error}</div>}
          {!result && !loading && (
            <div className="glass" style={{ borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", color: "#4b5563", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.3 }}>⚡</div>
              <p style={{ fontSize: "0.875rem" }}>Paste code and analyze performance</p>
              <p style={{ fontSize: "0.75rem", color: "#374151", marginTop: "0.5rem" }}>Detects nested loops, recursion, N+1 patterns</p>
            </div>
          )}
          {loading && (
            <div className="glass" style={{ borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
              <div style={{ width: 44, height: 44, border: "3px solid #1e3a5f", borderTop: "3px solid #f97316", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Analyzing complexity patterns...</p>
            </div>
          )}
          {result && (
            <>
              <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                  <Stat label="Issues Found" value={result.issues?.length || 0} color="#ef4444" />
                  <Stat label="Functions" value={result.functions_analyzed || 0} color="#3b82f6" />
                  <Stat label="Complexity" value={result.overall_complexity || "N/A"} color={result.overall_complexity === "High" ? "#ef4444" : result.overall_complexity === "Medium" ? "#f59e0b" : "#10b981"} />
                </div>
              </div>

              {result.issues?.map((issue, i) => (
                <div key={i} style={{ padding: "1rem", background: `${ISSUE_COLOR[issue.severity] || "#6b7280"}11`, border: `1px solid ${ISSUE_COLOR[issue.severity] || "#6b7280"}33`, borderRadius: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "#93c5fd" }}>{issue.function}</span>
                      {issue.line && <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>line {issue.line}</span>}
                    </div>
                    <span style={{ padding: "2px 10px", borderRadius: 999, background: `${ISSUE_COLOR[issue.severity]}22`, color: ISSUE_COLOR[issue.severity], fontSize: "0.7rem" }}>{issue.severity}</span>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "#e5e7eb", marginBottom: "0.4rem" }}>{issue.description}</div>
                  {issue.complexity && <div style={{ fontSize: "0.75rem", color: "#f59e0b" }}>Complexity: {issue.complexity}</div>}
                  {issue.suggestion && <div style={{ fontSize: "0.75rem", color: "#34d399", marginTop: "0.25rem" }}>💡 {issue.suggestion}</div>}
                </div>
              ))}

              {result.ai_analysis && (
                <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>AI Performance Review</div>
                  <pre style={{ fontSize: "0.78rem", color: "#d1d5db", whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>{result.ai_analysis}</pre>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "1.2rem", fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280" }}>{label}</div>
    </div>
  );
}
