import React, { useState } from "react";
import { bugFixAgent } from "../api";

const SEV_COLOR = { high: "#ef4444", medium: "#f59e0b", low: "#6b7280" };
const SEV_BG    = { high: "rgba(239,68,68,0.1)", medium: "rgba(245,158,11,0.1)", low: "rgba(107,114,128,0.1)" };
const CAT_ICON  = { bug: "🐛", security: "🔒", style: "✨", complexity: "⚡" };

export default function BugFixAgentPage() {
  const [files, setFiles] = useState({ "main.py": EXAMPLE_CODE });
  const [activeFile, setActiveFile] = useState("main.py");
  const [newName, setNewName] = useState("");
  const [severity, setSeverity] = useState("all");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedPatch, setExpandedPatch] = useState(null);

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

  const handleRun = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await bugFixAgent(files, severity, 3);
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div className="glass" style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🤖</div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Autonomous Bug-Fix Agent</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "4px 0 0" }}>
            Scans your project, detects issues, and generates AI fix patches — like GitHub Copilot Autofix
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: "1.5rem" }}>
        {/* Left: File Manager + Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* File tabs */}
          <div className="glass" style={{ borderRadius: 16, padding: "1rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Project Files</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" }}>
              {Object.keys(files).map(name => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <button onClick={() => setActiveFile(name)} style={{
                    padding: "4px 10px", borderRadius: 8, border: `1px solid ${activeFile === name ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.1)"}`,
                    background: activeFile === name ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                    color: activeFile === name ? "#93c5fd" : "#9ca3af", fontSize: "0.75rem", cursor: "pointer", fontFamily: "monospace",
                  }}>{name}</button>
                  {Object.keys(files).length > 1 && (
                    <button onClick={() => removeFile(name)} style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: "0.7rem" }}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addFile()}
                placeholder="new_file.py"
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 10px", color: "#e5e7eb", fontSize: "0.75rem", outline: "none", fontFamily: "monospace" }} />
              <button onClick={addFile} style={{ padding: "5px 12px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, color: "#93c5fd", fontSize: "0.75rem", cursor: "pointer" }}>+ Add</button>
            </div>
          </div>

          {/* Code editor */}
          {activeFile && (
            <div className="glass" style={{ borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.7rem", color: "#6b7280", fontFamily: "monospace" }}>{activeFile}</div>
              <textarea value={files[activeFile] || ""} onChange={e => setFiles(f => ({ ...f, [activeFile]: e.target.value }))}
                style={{ width: "100%", minHeight: "260px", background: "#1e1e1e", border: "none", padding: "1rem", color: "#d4d4d4", fontSize: "0.8rem", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
            </div>
          )}

          {/* Severity filter */}
          <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>Severity Filter</div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {["all", "high+medium", "high"].map(s => (
                <button key={s} onClick={() => setSeverity(s)} style={{
                  flex: 1, padding: "6px", borderRadius: 8, border: `1px solid ${severity === s ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.1)"}`,
                  background: severity === s ? "rgba(59,130,246,0.15)" : "transparent",
                  color: severity === s ? "#93c5fd" : "#6b7280", fontSize: "0.75rem", cursor: "pointer",
                }}>{s}</button>
              ))}
            </div>
          </div>

          <button onClick={handleRun} disabled={loading}
            style={{ padding: "13px", background: loading ? "#1e3a5f" : "linear-gradient(135deg,#dc2626,#7c3aed)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, fontSize: "1rem", cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Agent scanning..." : "🤖 Run Bug-Fix Agent →"}
          </button>
        </div>

        {/* Right: Results */}
        <div className="glass" style={{ borderRadius: 20, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.875rem", color: "#d1d5db" }}>Agent Report</span>
            {result && (
              <div style={{ display: "flex", gap: "1rem" }}>
                <Stat label="Scanned" value={result.files_scanned} color="#3b82f6" />
                <Stat label="Issues" value={result.issues_found} color="#ef4444" />
                <Stat label="Patches" value={result.patches_generated} color="#10b981" />
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem", maxHeight: "680px" }}>
            {error && <div style={{ padding: "1rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 12, color: "#fca5a5", fontSize: "0.875rem" }}>{error}</div>}

            {!result && !error && !loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "4rem 0", color: "#4b5563", textAlign: "center" }}>
                <div className="float" style={{ fontSize: "3.5rem", marginBottom: "1rem", opacity: 0.4 }}>🤖</div>
                <p style={{ fontSize: "0.875rem" }}>Add your project files and run the agent</p>
                <p style={{ fontSize: "0.75rem", color: "#374151", marginTop: "0.5rem" }}>AI will scan, detect issues, and generate fix patches</p>
              </div>
            )}

            {loading && <AgentTimeline />}

            {result && result.patches.length === 0 && (
              <div style={{ padding: "1.5rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, color: "#34d399", textAlign: "center" }}>
                ✓ No issues found — your code looks clean!
              </div>
            )}

            {result?.patches.map((patch, i) => (
              <PatchCard key={i} patch={patch} index={i}
                expanded={expandedPatch === i}
                onToggle={() => setExpandedPatch(expandedPatch === i ? null : i)} />
            ))}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function Stat({ label, value, color }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280" }}>{label}</div>
    </div>
  );
}

function PatchCard({ patch, index, expanded, onToggle }) {
  const sev = patch.severity || "low";
  return (
    <div style={{ marginBottom: "0.75rem", borderRadius: 14, border: `1px solid ${SEV_COLOR[sev]}33`, background: SEV_BG[sev], overflow: "hidden" }}>
      {/* Header */}
      <button onClick={onToggle} style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: "0.75rem", padding: "0.875rem 1rem", background: "transparent", border: "none", cursor: "pointer", textAlign: "left" }}>
        <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>{CAT_ICON[patch.category] || "⚠"}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.25rem" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "#93c5fd" }}>{patch.file}</span>
            <span style={{ color: "#4b5563", fontSize: "0.75rem" }}>line {patch.line}</span>
            <span style={{ padding: "1px 8px", borderRadius: 999, background: `${SEV_COLOR[sev]}22`, border: `1px solid ${SEV_COLOR[sev]}44`, color: SEV_COLOR[sev], fontSize: "0.7rem" }}>{sev}</span>
            <span style={{ padding: "1px 8px", borderRadius: 999, background: "rgba(255,255,255,0.05)", color: "#9ca3af", fontSize: "0.7rem" }}>{patch.category}</span>
            {patch.confidence && (
              <span style={{ padding: "1px 8px", borderRadius: 999, background: patch.confidence === "high" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)", color: patch.confidence === "high" ? "#34d399" : "#fbbf24", fontSize: "0.7rem" }}>
                {patch.confidence} confidence
              </span>
            )}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#d1d5db" }}>{patch.description}</div>
          {patch.explanation && <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.25rem" }}>Fix: {patch.explanation}</div>}
        </div>
        <span style={{ color: "#4b5563", fontSize: "0.75rem", flexShrink: 0 }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Expanded: diff patch */}
      {expanded && (
        <div style={{ borderTop: `1px solid ${SEV_COLOR[sev]}22`, padding: "0.875rem 1rem" }}>
          {patch.code_snippet && (
            <div style={{ marginBottom: "0.75rem" }}>
              <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>Context</div>
              <pre style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "monospace", background: "rgba(0,0,0,0.3)", borderRadius: 8, padding: "0.75rem", overflowX: "auto", margin: 0 }}>{patch.code_snippet}</pre>
            </div>
          )}
          {patch.patch && (
            <div>
              <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>AI Fix Patch</div>
              <pre style={{ fontSize: "0.75rem", fontFamily: "monospace", background: "rgba(0,0,0,0.4)", borderRadius: 8, padding: "0.875rem", overflowX: "auto", margin: 0, lineHeight: 1.6 }}>
                {patch.patch.split("\n").map((line, i) => {
                  const color = line.startsWith("+") ? "#34d399" : line.startsWith("-") ? "#f87171" : line.startsWith("@@") ? "#93c5fd" : line.startsWith("---") || line.startsWith("+++") ? "#a78bfa" : "#9ca3af";
                  return <span key={i} style={{ color, display: "block" }}>{line}</span>;
                })}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const AGENT_STEPS = [
  "Scanning project files...",
  "Running static analysis (pylint + bandit)...",
  "Extracting issue locations...",
  "Sending issues to AI model...",
  "Generating fix patches...",
  "Compiling agent report...",
];

function AgentTimeline() {
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, AGENT_STEPS.length - 1)), 2000);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ padding: "2rem 1rem" }}>
      <div style={{ width: 44, height: 44, border: "3px solid #1e3a5f", borderTop: "3px solid #ef4444", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {AGENT_STEPS.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", opacity: i <= step ? 1 : 0.2, transition: "opacity 0.5s" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: i < step ? "#10b981" : i === step ? "#ef4444" : "#374151", flexShrink: 0 }} />
            <span style={{ fontSize: "0.8rem", color: i <= step ? "#d1d5db" : "#4b5563" }}>{s}</span>
            {i === step && <span style={{ fontSize: "0.7rem", color: "#ef4444" }}>●</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

const EXAMPLE_CODE = `import os
import subprocess

def process_user_data(user_input):
    temp = None  # unused variable
    query = "SELECT * FROM users WHERE name = '" + user_input + "'"
    
    items = [1, 2, 3, 4, 5]
    for i in range(len(items)):
        print(items[i])
    
    password = "admin123"  # hardcoded secret
    
    result = eval(user_input)  # unsafe eval
    return result

def calculate(a, b):
    return a/b  # no zero division check

class UserManager:
    def __init__(self):
        self.users = []
    
    def add_user(self, name, email):
        self.users.append({"name": name, "email": email})
`;
