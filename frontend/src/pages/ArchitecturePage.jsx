import React, { useState } from "react";
import { architectureScan } from "../api";

export default function ArchitecturePage() {
  const [files, setFiles] = useState({ "main.py": "# Paste your main file here\n" });
  const [newName, setNewName] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeFile, setActiveFile] = useState("main.py");

  const addFile = () => {
    const name = newName.trim() || `file${Object.keys(files).length + 1}.py`;
    setFiles(f => ({ ...f, [name]: "" }));
    setActiveFile(name);
    setNewName("");
  };

  const removeFile = (name) => {
    const updated = { ...files };
    delete updated[name];
    setFiles(updated);
    setActiveFile(Object.keys(updated)[0] || "");
  };

  const handleScan = async () => {
    setLoading(true); setError(null);
    try {
      const res = await architectureScan(files);
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div className="glass" style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🏗️</div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Architecture Summarizer</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "4px 0 0" }}>AI maps your project structure — modules, services, dependencies</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* File Manager */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* File tabs */}
          <div className="glass" style={{ borderRadius: "16px", padding: "1rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Project Files</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" }}>
              {Object.keys(files).map(name => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button onClick={() => setActiveFile(name)}
                    style={{ padding: "4px 12px", background: activeFile === name ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${activeFile === name ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.1)"}`, borderRadius: 8, color: activeFile === name ? "#93c5fd" : "#9ca3af", fontSize: "0.75rem", cursor: "pointer", fontFamily: "monospace" }}>
                    {name}
                  </button>
                  {Object.keys(files).length > 1 && (
                    <button onClick={() => removeFile(name)}
                      style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: "0.75rem", padding: "0 2px" }}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addFile()}
                placeholder="filename.py"
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "6px 10px", color: "#e5e7eb", fontSize: "0.75rem", outline: "none", fontFamily: "monospace" }} />
              <button onClick={addFile}
                style={{ padding: "6px 14px", background: "rgba(59,130,246,0.2)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, color: "#93c5fd", fontSize: "0.75rem", cursor: "pointer" }}>
                + Add File
              </button>
            </div>
          </div>

          {/* Code editor for active file */}
          {activeFile && (
            <div className="glass" style={{ borderRadius: "16px", overflow: "hidden" }}>
              <div style={{ padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.75rem", color: "#6b7280", fontFamily: "monospace" }}>{activeFile}</div>
              <textarea
                value={files[activeFile] || ""}
                onChange={e => setFiles(f => ({ ...f, [activeFile]: e.target.value }))}
                style={{ width: "100%", minHeight: "300px", background: "#1e1e1e", border: "none", padding: "1rem", color: "#d4d4d4", fontSize: "0.8rem", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }}
              />
            </div>
          )}

          <button onClick={handleScan} disabled={loading || Object.keys(files).length === 0}
            style={{ padding: "13px", background: loading ? "#1e3a5f" : "linear-gradient(135deg,#2563eb,#7c3aed)", border: "none", borderRadius: "12px", color: "white", fontWeight: 600, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Analyzing architecture..." : `Analyze ${Object.keys(files).length} File${Object.keys(files).length !== 1 ? "s" : ""} →`}
          </button>
        </div>

        {/* Output */}
        <div className="glass" style={{ borderRadius: "20px", overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.875rem", color: "#d1d5db" }}>Architecture Summary</span>
            {result && <span style={{ fontSize: "0.75rem", color: "#34d399" }}>✓ {result.files_analyzed} files analyzed</span>}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", maxHeight: "600px" }}>
            {error && <div style={{ padding: "1rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 12, color: "#fca5a5", fontSize: "0.875rem" }}>{error}</div>}
            {!result && !error && !loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "4rem 0", color: "#4b5563", textAlign: "center" }}>
                <div className="float" style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.4 }}>🏗️</div>
                <p style={{ fontSize: "0.875rem" }}>Add your project files and click Analyze</p>
                <p style={{ fontSize: "0.75rem", color: "#374151", marginTop: "0.5rem" }}>AI will map modules, services, and dependencies</p>
              </div>
            )}
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "4rem 0" }}>
                <div style={{ width: 40, height: 40, border: "3px solid #1e3a5f", borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
                <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Mapping architecture...</p>
              </div>
            )}
            {result && (
              <pre style={{ fontSize: "0.875rem", color: "#d1d5db", whiteSpace: "pre-wrap", lineHeight: 1.7, fontFamily: "inherit" }}>
                {result.architecture_summary}
              </pre>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
