import React, { useState } from "react";
import { polyglotAnalyze } from "../api";

const LANG_EXAMPLES = {
  "app.py":    `import os\n\ndef process(user_input):\n    query = "SELECT * FROM users WHERE name = '" + user_input + "'"\n    password = "admin123"\n    result = eval(user_input)\n    return result\n`,
  "index.js":  `var x = 1;\nfunction login(user, pass) {\n  if (pass == "admin") {\n    eval(user);\n    console.log("logged in");\n  }\n}\n`,
  "Main.java": `public class Main {\n  public static void main(String[] args) {\n    String password = "secret123";\n    System.out.println("Hello " + password);\n    try { int x = 1/0; } catch (Exception e) { System.out.println(e); }\n  }\n}\n`,
};

const SEV_COLOR = { error: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };

export default function PolyglotPage() {
  const [filename, setFilename] = useState("app.py");
  const [code, setCode] = useState(LANG_EXAMPLES["app.py"]);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadExample = (fname) => { setFilename(fname); setCode(LANG_EXAMPLES[fname]); setResult(null); };

  const handleAnalyze = async () => {
    setLoading(true); setError(null); setResult(null);
    try { const res = await polyglotAnalyze(code, filename); setResult(res.data); }
    catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div className="glass" style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🌐</div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Multi-Language Analyzer</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "4px 0 0" }}>Python · JavaScript · TypeScript · Java — language-specific static analysis + AI review</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="glass" style={{ borderRadius: 16, padding: "1rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Load Example</div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {Object.keys(LANG_EXAMPLES).map(f => (
                <button key={f} onClick={() => loadExample(f)} style={{
                  padding: "5px 12px", borderRadius: 8, border: `1px solid ${filename === f ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.1)"}`,
                  background: filename === f ? "rgba(59,130,246,0.15)" : "transparent",
                  color: filename === f ? "#93c5fd" : "#9ca3af", fontSize: "0.75rem", cursor: "pointer", fontFamily: "monospace",
                }}>{f}</button>
              ))}
            </div>
          </div>
          <div className="glass" style={{ borderRadius: 14, padding: "0.875rem" }}>
            <input value={filename} onChange={e => setFilename(e.target.value)} placeholder="filename.py / .js / .ts / .java"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 12px", color: "#e5e7eb", fontSize: "0.8rem", outline: "none", fontFamily: "monospace", boxSizing: "border-box" }} />
          </div>
          <div className="glass" style={{ borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "7px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.7rem", color: "#6b7280", fontFamily: "monospace" }}>{filename}</div>
            <textarea value={code} onChange={e => setCode(e.target.value)}
              style={{ width: "100%", minHeight: "300px", background: "#1e1e1e", border: "none", padding: "1rem", color: "#d4d4d4", fontSize: "0.8rem", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          </div>
          <button onClick={handleAnalyze} disabled={loading}
            style={{ padding: "13px", background: loading ? "#1e3a5f" : "linear-gradient(135deg,#2563eb,#7c3aed)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Analyzing..." : "🌐 Analyze →"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && <div style={{ padding: "1rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 12, color: "#fca5a5", fontSize: "0.875rem" }}>{error}</div>}
          {!result && !loading && (
            <div className="glass" style={{ borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", color: "#4b5563", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.3 }}>🌐</div>
              <p style={{ fontSize: "0.875rem" }}>Select a language and analyze</p>
            </div>
          )}
          {loading && (
            <div className="glass" style={{ borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
              <div style={{ width: 44, height: 44, border: "3px solid #1e3a5f", borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Running language engine...</p>
            </div>
          )}
          {result && (
            <>
              <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                  <Stat label="Language" value={result.language} color="#a78bfa" />
                  <Stat label="Functions" value={result.functions?.length || 0} color="#10b981" />
                  <Stat label="Classes" value={result.classes?.length || 0} color="#3b82f6" />
                  <Stat label="Static Issues" value={result.static_issues?.length || 0} color="#ef4444" />
                  <Stat label="Confidence Findings" value={result.confidence_findings?.length || 0} color="#f59e0b" />
                </div>
              </div>

              {result.static_issues?.length > 0 && (
                <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Static Issues</div>
                  {result.static_issues.slice(0, 10).map((issue, i) => (
                    <div key={i} style={{ display: "flex", gap: "0.75rem", padding: "0.5rem 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                      <span style={{ padding: "1px 8px", borderRadius: 999, background: `${SEV_COLOR[issue.severity] || "#6b7280"}22`, color: SEV_COLOR[issue.severity] || "#6b7280", fontSize: "0.65rem", flexShrink: 0 }}>{issue.severity}</span>
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>L{issue.line}</span>
                      <span style={{ fontSize: "0.75rem", color: "#d1d5db" }}>{issue.message}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.confidence_findings?.length > 0 && (
                <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Confidence-Scored Findings</div>
                  {result.confidence_findings.map((f, i) => (
                    <div key={i} style={{ padding: "0.75rem", marginBottom: "0.5rem", background: "rgba(255,255,255,0.03)", borderRadius: 10, border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                        <span style={{ fontSize: "0.8rem", color: "#e5e7eb" }}>{f.issue}</span>
                        <span style={{ fontSize: "0.75rem", color: f.confidence_label === "high" ? "#34d399" : f.confidence_label === "medium" ? "#fbbf24" : "#6b7280" }}>
                          {Math.round(f.confidence * 100)}% {f.confidence_label}
                        </span>
                      </div>
                      {f.data_flow && <div style={{ fontSize: "0.7rem", color: "#6b7280", fontFamily: "monospace" }}>{f.data_flow}</div>}
                    </div>
                  ))}
                </div>
              )}

              {result.ai_review && (
                <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>AI Review</div>
                  <pre style={{ fontSize: "0.78rem", color: "#d1d5db", whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>{result.ai_review}</pre>
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
