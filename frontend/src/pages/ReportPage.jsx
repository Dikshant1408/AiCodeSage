import React, { useState } from "react";
import { generateReport } from "../api";
const EXAMPLE = `import os\n\ndef process_user(user_input):\n    query = "SELECT * FROM users WHERE name = '" + user_input + "'"\n    password = "admin123"\n    result = eval(user_input)\n    return result\n\ndef calculate(a, b):\n    return a / b\n`;

export default function ReportPage() {
  const [code, setCode] = useState(EXAMPLE);
  const [repoName, setRepoName] = useState("my-project");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setLoading(true); setError(null); setReport(null);
    try {
      const res = await generateReport(code, repoName);
      setReport(res.data);
    } catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  };

  const handleDownloadMd = () => {
    if (!report) return;
    const blob = new Blob([report.markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `${repoName}-report.md`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!report) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const lines = doc.splitTextToSize(report.markdown.replace(/[#*`]/g, ""), 180);
      let y = 20;
      doc.setFontSize(16);
      doc.text(`${repoName} — AI Code Analysis Report`, 15, y); y += 12;
      doc.setFontSize(9);
      for (const line of lines) {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.text(line, 15, y); y += 5;
      }
      doc.save(`${repoName}-report.pdf`);
    } catch (e) { alert("PDF export failed: " + e.message); }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div className="glass" style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>📄</div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Export Report</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "4px 0 0" }}>Generate a full AI analysis report — export as Markdown or PDF</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="glass" style={{ borderRadius: 14, padding: "0.875rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Project Name</div>
            <input value={repoName} onChange={e => setRepoName(e.target.value)}
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 12px", color: "#e5e7eb", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div className="glass" style={{ borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "7px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.7rem", color: "#6b7280" }}>Code to Analyze</div>
            <textarea value={code} onChange={e => setCode(e.target.value)}
              style={{ width: "100%", minHeight: "300px", background: "#1e1e1e", border: "none", padding: "1rem", color: "#d4d4d4", fontSize: "0.78rem", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          </div>
          <button onClick={handleGenerate} disabled={loading}
            style={{ padding: "13px", background: loading ? "#1e3a5f" : "linear-gradient(135deg,#2563eb,#059669)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Generating report..." : "📄 Generate Report →"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && <div style={{ padding: "1rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 12, color: "#fca5a5", fontSize: "0.875rem" }}>{error}</div>}
          {!report && !loading && (
            <div className="glass" style={{ borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", color: "#4b5563", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.3 }}>📄</div>
              <p style={{ fontSize: "0.875rem" }}>Generate a report to export</p>
              <p style={{ fontSize: "0.75rem", color: "#374151", marginTop: "0.5rem" }}>Includes quality score, bugs, security, architecture</p>
            </div>
          )}
          {loading && (
            <div className="glass" style={{ borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
              <div style={{ width: 44, height: 44, border: "3px solid #1e3a5f", borderTop: "3px solid #2563eb", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Running full analysis pipeline...</p>
            </div>
          )}
          {report && (
            <>
              <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span style={{ fontSize: "0.8rem", color: "#9ca3af", fontWeight: 600 }}>Report Ready</span>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button onClick={handleDownloadMd} style={{ padding: "6px 14px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, color: "#93c5fd", fontSize: "0.75rem", cursor: "pointer" }}>
                      ⬇ Markdown
                    </button>
                    <button onClick={handleDownloadPdf} style={{ padding: "6px 14px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, color: "#fca5a5", fontSize: "0.75rem", cursor: "pointer" }}>
                      ⬇ PDF
                    </button>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
                  {report.quality && (
                    <>
                      <Stat label="Quality Score" value={`${report.quality.score}/10`} color={report.quality.score >= 7 ? "#10b981" : report.quality.score >= 5 ? "#f59e0b" : "#ef4444"} />
                      <Stat label="Grade" value={report.quality.grade} color="#a78bfa" />
                      <Stat label="Bugs" value={report.quality.bugs} color="#ef4444" />
                      <Stat label="Security" value={report.quality.security_issues} color="#f59e0b" />
                    </>
                  )}
                </div>
              </div>
              <div className="glass" style={{ borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "7px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.7rem", color: "#6b7280" }}>Report Preview (Markdown)</div>
                <div style={{ padding: "1rem", maxHeight: "500px", overflowY: "auto" }}>
                  <pre style={{ fontSize: "0.75rem", color: "#d1d5db", whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0, fontFamily: "monospace" }}>{report.markdown}</pre>
                </div>
              </div>
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
