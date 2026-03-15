import React, { useState } from "react";
import { runAutopilot } from "../api";

const EXAMPLE = {
  "auth.py": `import os\n\ndef login(username, password):\n    query = "SELECT * FROM users WHERE name = '" + username + "'"\n    secret = "hardcoded_key_123"\n    result = eval(username)\n    return result\n\ndef process(items):\n    for i in range(len(items)):\n        print(items[i])\n`,
};

export default function AutopilotPage() {
  const [files, setFiles] = useState(EXAMPLE);
  const [activeFile, setActiveFile] = useState("auth.py");
  const [newName, setNewName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(0);

  const STEPS = ["Scanning all files...", "Running static analysis...", "Identifying top issues...", "Prioritizing fixes...", "Generating improvement plans...", "Compiling autopilot report..."];

  const addFile = () => {
    const name = newName.trim() || `file${Object.keys(files).length + 1}.py`;
    setFiles(f => ({ ...f, [name]: "" })); setActiveFile(name); setNewName("");
  };

  const handleRun = async () => {
    setLoading(true); setError(null); setResult(null); setStep(0);
    const interval = setInterval(() => setStep(s => Math.min(s + 1, STEPS.length - 1)), 3000);
    try { const res = await runAutopilot(files, 5); setResult(res.data); }
    catch (e) { setError(e.response?.data?.detail || e.message); }
    clearInterval(interval); setLoading(false);
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div className="glass" style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🚀</div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>AI Codebase Autopilot</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "4px 0 0" }}>Autonomous multi-step improvement agent — scan → identify → prioritize → generate fixes</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="glass" style={{ borderRadius: 16, padding: "1rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Project Files</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" }}>
              {Object.keys(files).map(name => (
                <button key={name} onClick={() => setActiveFile(name)} style={{
                  padding: "4px 10px", borderRadius: 8, border: `1px solid ${activeFile === name ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.1)"}`,
                  background: activeFile === name ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                  color: activeFile === name ? "#93c5fd" : "#9ca3af", fontSize: "0.75rem", cursor: "pointer", fontFamily: "monospace",
                }}>{name}</button>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addFile()} placeholder="new_file.py"
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 10px", color: "#e5e7eb", fontSize: "0.75rem", outline: "none", fontFamily: "monospace" }} />
              <button onClick={addFile} style={{ padding: "5px 12px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, color: "#93c5fd", fontSize: "0.75rem", cursor: "pointer" }}>+ Add</button>
            </div>
          </div>

          {activeFile && (
            <div className="glass" style={{ borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "7px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.7rem", color: "#6b7280", fontFamily: "monospace" }}>{activeFile}</div>
              <textarea value={files[activeFile] || ""} onChange={e => setFiles(f => ({ ...f, [activeFile]: e.target.value }))}
                style={{ width: "100%", minHeight: "260px", background: "#1e1e1e", border: "none", padding: "1rem", color: "#d4d4d4", fontSize: "0.78rem", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
            </div>
          )}

          <button onClick={handleRun} disabled={loading}
            style={{ padding: "13px", background: loading ? "#1e3a5f" : "linear-gradient(135deg,#059669,#7c3aed)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Autopilot running..." : "🚀 Run Autopilot →"}
          </button>
        </div>

        <div className="glass" style={{ borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <span style={{ fontSize: "0.875rem", color: "#d1d5db" }}>Autopilot Report</span>
            {result && <span style={{ marginLeft: "1rem", fontSize: "0.75rem", color: "#10b981" }}>{result.files_processed} files processed</span>}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", maxHeight: "680px" }}>
            {error && <div style={{ padding: "1rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 12, color: "#fca5a5", fontSize: "0.875rem" }}>{error}</div>}
            {!result && !loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "4rem 0", color: "#4b5563", textAlign: "center" }}>
                <div style={{ fontSize: "3.5rem", marginBottom: "1rem", opacity: 0.3 }}>🚀</div>
                <p style={{ fontSize: "0.875rem" }}>Add files and run the autopilot agent</p>
              </div>
            )}
            {loading && (
              <div style={{ padding: "2rem 1rem" }}>
                <div style={{ width: 44, height: 44, border: "3px solid #1e3a5f", borderTop: "3px solid #059669", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  {STEPS.map((s, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", opacity: i <= step ? 1 : 0.2, transition: "opacity 0.5s" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: i < step ? "#10b981" : i === step ? "#059669" : "#374151", flexShrink: 0 }} />
                      <span style={{ fontSize: "0.8rem", color: i <= step ? "#d1d5db" : "#4b5563" }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {result?.results?.map((r, i) => (
              <div key={i} style={{ marginBottom: "1.5rem", padding: "1.25rem", background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span style={{ fontFamily: "monospace", fontSize: "0.9rem", color: "#93c5fd" }}>{r.file}</span>
                  <div style={{ display: "flex", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Before: <span style={{ color: r.before_score >= 7 ? "#10b981" : r.before_score >= 5 ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>{r.before_score?.toFixed(1)}/10 ({r.before_grade})</span></span>
                  </div>
                </div>
                <pre style={{ fontSize: "0.78rem", color: "#d1d5db", whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>{r.improvement_plan}</pre>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
