import React, { useState } from "react";
import { learningMode } from "../api";

const EXAMPLE = `def binary_search(arr, target):\n    left, right = 0, len(arr) - 1\n    while left <= right:\n        mid = (left + right) // 2\n        if arr[mid] == target:\n            return mid\n        elif arr[mid] < target:\n            left = mid + 1\n        else:\n            right = mid - 1\n    return -1\n`;

const LEVELS = [
  { id: "beginner", label: "Beginner", icon: "🌱", desc: "First-time coder" },
  { id: "intermediate", label: "Intermediate", icon: "⚡", desc: "1-2 years exp" },
  { id: "advanced", label: "Advanced", icon: "🚀", desc: "Deep insights" },
];

export default function LearningPage() {
  const [code, setCode] = useState(EXAMPLE);
  const [level, setLevel] = useState("beginner");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleExplain = async () => {
    setLoading(true); setError(null); setResult(null);
    try { const res = await learningMode(code, level); setResult(res.data); }
    catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div className="glass" style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🎓</div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Learning Mode</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "4px 0 0" }}>AI explains code at your level — step-by-step, with analogies, complexity, and exercises</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="glass" style={{ borderRadius: 16, padding: "1rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Learning Level</div>
            {LEVELS.map(l => (
              <button key={l.id} onClick={() => setLevel(l.id)} style={{
                width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "10px 12px", marginBottom: "0.4rem",
                borderRadius: 10, border: `1px solid ${level === l.id ? "rgba(139,92,246,0.5)" : "rgba(255,255,255,0.08)"}`,
                background: level === l.id ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.03)",
                cursor: "pointer", textAlign: "left",
              }}>
                <span style={{ fontSize: "1.2rem" }}>{l.icon}</span>
                <div>
                  <div style={{ fontSize: "0.8rem", color: level === l.id ? "#c4b5fd" : "#d1d5db", fontWeight: 600 }}>{l.label}</div>
                  <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>{l.desc}</div>
                </div>
              </button>
            ))}
          </div>
          <div className="glass" style={{ borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "7px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.7rem", color: "#6b7280" }}>Code to Learn</div>
            <textarea value={code} onChange={e => setCode(e.target.value)}
              style={{ width: "100%", minHeight: "280px", background: "#1e1e1e", border: "none", padding: "1rem", color: "#d4d4d4", fontSize: "0.8rem", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          </div>
          <button onClick={handleExplain} disabled={loading}
            style={{ padding: "13px", background: loading ? "#1e3a5f" : "linear-gradient(135deg,#7c3aed,#059669)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Explaining..." : "🎓 Explain Code →"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && <div style={{ padding: "1rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 12, color: "#fca5a5", fontSize: "0.875rem" }}>{error}</div>}
          {!result && !loading && (
            <div className="glass" style={{ borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", color: "#4b5563", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.3 }}>🎓</div>
              <p style={{ fontSize: "0.875rem" }}>Paste code and choose your level</p>
              <p style={{ fontSize: "0.75rem", color: "#374151", marginTop: "0.5rem" }}>AI will explain it in a way that makes sense for you</p>
            </div>
          )}
          {loading && (
            <div className="glass" style={{ borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
              <div style={{ width: 44, height: 44, border: "3px solid #1e3a5f", borderTop: "3px solid #7c3aed", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Crafting explanation for {level} level...</p>
            </div>
          )}
          {result && (
            <div className="glass" style={{ borderRadius: 20, padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
                <span style={{ fontSize: "1.2rem" }}>{LEVELS.find(l => l.id === result.level)?.icon}</span>
                <span style={{ fontSize: "0.8rem", color: "#c4b5fd", fontWeight: 600 }}>{result.level} explanation</span>
              </div>
              <pre style={{ fontSize: "0.82rem", color: "#d1d5db", whiteSpace: "pre-wrap", lineHeight: 1.8, margin: 0 }}>{result.explanation}</pre>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
