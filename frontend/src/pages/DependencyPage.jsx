import React, { useState } from "react";
import { dependencyScan } from "../api";

const EXAMPLE_REQ = `requests==2.19.0\nflask==1.0.2\nsqlalchemy==1.2.0\nnumpy==1.16.0\npillow==5.4.1\n`;
const EXAMPLE_PKG = `{\n  "dependencies": {\n    "lodash": "4.17.4",\n    "express": "4.16.0",\n    "axios": "0.18.0"\n  }\n}`;

const SEV_COLOR = { CRITICAL: "#ef4444", HIGH: "#f97316", MEDIUM: "#f59e0b", LOW: "#3b82f6" };

export default function DependencyPage() {
  const [filename, setFilename] = useState("requirements.txt");
  const [content, setContent] = useState(EXAMPLE_REQ);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleScan = async () => {
    setLoading(true); setError(null); setResult(null);
    try { const res = await dependencyScan(content, filename); setResult(res.data); }
    catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div className="glass" style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🔒</div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Dependency Security Scanner</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "4px 0 0" }}>Scan requirements.txt or package.json for known CVEs via OSV database — like Snyk</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>File Type</div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {[["requirements.txt", EXAMPLE_REQ], ["package.json", EXAMPLE_PKG]].map(([f, ex]) => (
                <button key={f} onClick={() => { setFilename(f); setContent(ex); setResult(null); }} style={{
                  flex: 1, padding: "7px", borderRadius: 8, border: `1px solid ${filename === f ? "rgba(59,130,246,0.5)" : "rgba(255,255,255,0.1)"}`,
                  background: filename === f ? "rgba(59,130,246,0.15)" : "transparent",
                  color: filename === f ? "#93c5fd" : "#9ca3af", fontSize: "0.75rem", cursor: "pointer", fontFamily: "monospace",
                }}>{f}</button>
              ))}
            </div>
          </div>
          <div className="glass" style={{ borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "7px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.7rem", color: "#6b7280", fontFamily: "monospace" }}>{filename}</div>
            <textarea value={content} onChange={e => setContent(e.target.value)}
              style={{ width: "100%", minHeight: "280px", background: "#1e1e1e", border: "none", padding: "1rem", color: "#d4d4d4", fontSize: "0.8rem", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          </div>
          <button onClick={handleScan} disabled={loading}
            style={{ padding: "13px", background: loading ? "#1e3a5f" : "linear-gradient(135deg,#dc2626,#7c3aed)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Scanning..." : "🔒 Scan Dependencies →"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && <div style={{ padding: "1rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 12, color: "#fca5a5", fontSize: "0.875rem" }}>{error}</div>}
          {!result && !loading && (
            <div className="glass" style={{ borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", color: "#4b5563", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.3 }}>🔒</div>
              <p style={{ fontSize: "0.875rem" }}>Paste your dependency file and scan</p>
            </div>
          )}
          {loading && (
            <div className="glass" style={{ borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
              <div style={{ width: 44, height: 44, border: "3px solid #1e3a5f", borderTop: "3px solid #dc2626", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Querying OSV vulnerability database...</p>
            </div>
          )}
          {result && (
            <>
              <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                  <Stat label="Ecosystem" value={result.ecosystem} color="#a78bfa" />
                  <Stat label="Scanned" value={result.packages_scanned} color="#3b82f6" />
                  <Stat label="Vulnerable" value={result.vulnerability_count} color="#ef4444" />
                  <Stat label="Safe" value={result.safe_packages?.length || 0} color="#10b981" />
                </div>
              </div>

              {result.vulnerability_count === 0 && (
                <div style={{ padding: "1.5rem", background: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 14, color: "#34d399", textAlign: "center" }}>
                  ✓ No known vulnerabilities found in scanned packages
                </div>
              )}

              {result.vulnerabilities?.map((v, i) => (
                <div key={i} style={{ padding: "1rem", background: `${SEV_COLOR[v.severity] || "#6b7280"}11`, border: `1px solid ${SEV_COLOR[v.severity] || "#6b7280"}33`, borderRadius: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                    <div>
                      <span style={{ fontFamily: "monospace", fontSize: "0.9rem", color: "#e5e7eb", fontWeight: 600 }}>{v.package}</span>
                      <span style={{ color: "#6b7280", fontSize: "0.8rem", marginLeft: "0.5rem" }}>v{v.version}</span>
                    </div>
                    <span style={{ padding: "2px 10px", borderRadius: 999, background: `${SEV_COLOR[v.severity]}22`, color: SEV_COLOR[v.severity], fontSize: "0.7rem", fontWeight: 600 }}>{v.severity}</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#d1d5db", marginBottom: "0.5rem" }}>{v.summary}</div>
                  <div style={{ display: "flex", gap: "1rem", fontSize: "0.72rem" }}>
                    <span style={{ color: "#6b7280" }}>CVE: <span style={{ color: "#93c5fd", fontFamily: "monospace" }}>{v.vuln_id}</span></span>
                    {v.fixed_version && <span style={{ color: "#6b7280" }}>Fix: <span style={{ color: "#34d399" }}>upgrade to v{v.fixed_version}</span></span>}
                  </div>
                </div>
              ))}

              {result.safe_packages?.length > 0 && (
                <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Safe Packages ({result.safe_packages.length})</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {result.safe_packages.map(p => (
                      <span key={p} style={{ padding: "2px 10px", borderRadius: 999, background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", fontSize: "0.72rem", fontFamily: "monospace" }}>{p}</span>
                    ))}
                  </div>
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
