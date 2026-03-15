import React, { useState, useEffect } from "react";
import { benchmarkModels, listModels } from "../api";

const EXAMPLE = `def fibonacci(n):\n    if n <= 1:\n        return n\n    return fibonacci(n-1) + fibonacci(n-2)\n\nresult = fibonacci(10)\nprint(result)\n`;

export default function BenchmarkPage() {
  const [code, setCode] = useState(EXAMPLE);
  const [task, setTask] = useState("review");
  const [models, setModels] = useState(["deepseek-coder"]);
  const [availableModels, setAvailableModels] = useState([]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    listModels().then(r => setAvailableModels(r.data.models || [])).catch(() => {});
  }, []);

  const toggleModel = (m) => {
    setModels(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const handleBenchmark = async () => {
    if (!models.length) return;
    setLoading(true); setError(null); setResult(null);
    try { const res = await benchmarkModels(code, task, models); setResult(res.data); }
    catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  };

  const TASKS = ["review", "bugs", "security", "explain"];

  return (
    <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div className="glass" style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>⚖️</div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Model Benchmarking</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "4px 0 0" }}>Compare multiple Ollama models — response time, quality, output length</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="glass" style={{ borderRadius: 16, padding: "1rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Task</div>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {TASKS.map(t => (
                <button key={t} onClick={() => setTask(t)} style={{
                  padding: "5px 12px", borderRadius: 8, border: `1px solid ${task === t ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.1)"}`,
                  background: task === t ? "rgba(59,130,246,0.15)" : "transparent",
                  color: task === t ? "#93c5fd" : "#9ca3af", fontSize: "0.75rem", cursor: "pointer",
                }}>{t}</button>
              ))}
            </div>
          </div>

          <div className="glass" style={{ borderRadius: 16, padding: "1rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>
              Models {availableModels.length > 0 && <span style={{ color: "#10b981" }}>({availableModels.length} available)</span>}
            </div>
            {availableModels.length > 0 ? (
              availableModels.map(m => (
                <label key={m} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "6px 0", cursor: "pointer" }}>
                  <input type="checkbox" checked={models.includes(m)} onChange={() => toggleModel(m)} style={{ accentColor: "#3b82f6" }} />
                  <span style={{ fontSize: "0.8rem", color: "#d1d5db", fontFamily: "monospace" }}>{m}</span>
                </label>
              ))
            ) : (
              <div>
                <p style={{ fontSize: "0.75rem", color: "#6b7280", marginBottom: "0.5rem" }}>No models detected. Enter manually:</p>
                {["deepseek-coder", "codellama", "mistral"].map(m => (
                  <label key={m} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "5px 0", cursor: "pointer" }}>
                    <input type="checkbox" checked={models.includes(m)} onChange={() => toggleModel(m)} style={{ accentColor: "#3b82f6" }} />
                    <span style={{ fontSize: "0.78rem", color: "#9ca3af", fontFamily: "monospace" }}>{m}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="glass" style={{ borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "7px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.7rem", color: "#6b7280" }}>Code to Benchmark</div>
            <textarea value={code} onChange={e => setCode(e.target.value)}
              style={{ width: "100%", minHeight: "200px", background: "#1e1e1e", border: "none", padding: "1rem", color: "#d4d4d4", fontSize: "0.78rem", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          </div>

          <button onClick={handleBenchmark} disabled={loading || !models.length}
            style={{ padding: "13px", background: loading ? "#1e3a5f" : "linear-gradient(135deg,#d97706,#7c3aed)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Benchmarking..." : `⚖️ Run Benchmark (${models.length} model${models.length !== 1 ? "s" : ""}) →`}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && <div style={{ padding: "1rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 12, color: "#fca5a5", fontSize: "0.875rem" }}>{error}</div>}
          {!result && !loading && (
            <div className="glass" style={{ borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", color: "#4b5563", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.3 }}>⚖️</div>
              <p style={{ fontSize: "0.875rem" }}>Select models and run benchmark</p>
              <p style={{ fontSize: "0.75rem", color: "#374151", marginTop: "0.5rem" }}>Compares response time, length, and quality</p>
            </div>
          )}
          {loading && (
            <div className="glass" style={{ borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
              <div style={{ width: 44, height: 44, border: "3px solid #1e3a5f", borderTop: "3px solid #d97706", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Running {models.length} model{models.length !== 1 ? "s" : ""}...</p>
            </div>
          )}
          {result?.benchmarks?.map((b, i) => (
            <div key={i} className="glass" style={{ borderRadius: 16, overflow: "hidden", border: b.status === "error" ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(255,255,255,0.06)" }}>
              <div style={{ padding: "0.875rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "monospace", fontSize: "0.9rem", color: "#e5e7eb", fontWeight: 600 }}>{b.model}</span>
                <div style={{ display: "flex", gap: "1rem" }}>
                  {b.status === "ok" && (
                    <>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: b.response_time_sec < 10 ? "#10b981" : b.response_time_sec < 30 ? "#f59e0b" : "#ef4444" }}>{b.response_time_sec}s</div>
                        <div style={{ fontSize: "0.6rem", color: "#6b7280" }}>Response Time</div>
                      </div>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#3b82f6" }}>{b.response_length}</div>
                        <div style={{ fontSize: "0.6rem", color: "#6b7280" }}>Chars</div>
                      </div>
                    </>
                  )}
                  <span style={{ padding: "2px 10px", borderRadius: 999, background: b.status === "ok" ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)", color: b.status === "ok" ? "#34d399" : "#f87171", fontSize: "0.7rem" }}>{b.status}</span>
                </div>
              </div>
              {b.status === "ok" ? (
                <div style={{ padding: "1rem", maxHeight: "300px", overflowY: "auto" }}>
                  <pre style={{ fontSize: "0.78rem", color: "#d1d5db", whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>{b.response}</pre>
                </div>
              ) : (
                <div style={{ padding: "1rem", color: "#f87171", fontSize: "0.8rem" }}>{b.error}</div>
              )}
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
