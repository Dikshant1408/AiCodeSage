import React, { useState } from "react";
import { generateReport } from "../api";

const EXAMPLE = {
  "auth.py": `import os\nfrom flask import request\n\ndef login(username, password):\n    query = "SELECT * FROM users WHERE name = '" + username + "'"\n    secret = "hardcoded_key_123"\n    result = eval(username)\n    return result\n\ndef process(items):\n    for i in range(len(items)):\n        for j in range(len(items)):\n            print(items[i], items[j])\n`,
  "utils.py": `def fetch_users(db, ids):\n    results = []\n    for id in ids:\n        user = db.execute("SELECT * FROM users WHERE id=" + str(id))\n        results.append(user)\n    return results\n\ndef add(a, b):\n    return a + b\n\ndef add2(x, y):\n    return x + y\n`,
};

const GRADE_COLOR = { "A+": "#34d399", A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#f97316", F: "#ef4444" };
const scoreColor  = s => s >= 8 ? "#10b981" : s >= 6 ? "#3b82f6" : s >= 4 ? "#f59e0b" : "#ef4444";

export default function ReportPage() {
  const [files, setFiles]         = useState(EXAMPLE);
  const [activeFile, setActiveFile] = useState("auth.py");
  const [newName, setNewName]     = useState("");
  const [repoName, setRepoName]   = useState("my-project");
  const [report, setReport]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const addFile = () => {
    const name = newName.trim() || `file${Object.keys(files).length + 1}.py`;
    setFiles(f => ({ ...f, [name]: "" })); setActiveFile(name); setNewName("");
  };

  const removeFile = (name) => {
    const next = { ...files }; delete next[name]; setFiles(next);
    if (activeFile === name) setActiveFile(Object.keys(next)[0] || "");
  };

  const handleGenerate = async () => {
    setLoading(true); setError(null); setReport(null);
    try {
      const res = await generateReport(files, repoName, true);
      setReport(res.data); setActiveTab("overview");
    } catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  };

  const handleExportMd = () => {
    if (!report) return;
    const md = buildMarkdown(report);
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `${repoName}-intelligence-report.md`; a.click();
  };

  const handleExportPdf = async () => {
    if (!report) return;
    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const md = buildMarkdown(report);
      const lines = doc.splitTextToSize(md.replace(/[#*`|]/g, ""), 180);
      let y = 20;
      doc.setFontSize(14); doc.setTextColor(40, 40, 40);
      doc.text(`${repoName} — Intelligence Report`, 15, y); y += 10;
      doc.setFontSize(8); doc.setTextColor(80, 80, 80);
      for (const line of lines) {
        if (y > 285) { doc.addPage(); y = 15; }
        doc.text(line, 15, y); y += 4.5;
      }
      doc.save(`${repoName}-report.pdf`);
    } catch (e) { alert("PDF export failed: " + e.message); }
  };

  const TABS = ["overview", "security", "files", "graph", "ai summary"];

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.75rem" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>📊</div>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 800, background: "linear-gradient(135deg,#34d399,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Intelligence Report</h1>
          <p style={{ margin: "3px 0 0", color: "#6b7280", fontSize: "0.82rem" }}>All engines run in parallel — static analysis, taint tracking, duplicates, performance, graph</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "1.5rem" }}>
        {/* Left: input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Project Name</div>
            <input value={repoName} onChange={e => setRepoName(e.target.value)} style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#e5e7eb", fontSize: "0.82rem", outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Files</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.75rem" }}>
              {Object.keys(files).map(name => (
                <div key={name} style={{ display: "flex", alignItems: "center" }}>
                  <button onClick={() => setActiveFile(name)} style={{ padding: "3px 8px", borderRadius: "6px 0 0 6px", border: `1px solid ${activeFile === name ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.08)"}`, background: activeFile === name ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)", color: activeFile === name ? "#6ee7b7" : "#9ca3af", fontSize: "0.7rem", cursor: "pointer", fontFamily: "monospace" }}>{name}</button>
                  <button onClick={() => removeFile(name)} style={{ padding: "3px 5px", borderRadius: "0 6px 6px 0", border: "1px solid rgba(255,255,255,0.08)", borderLeft: "none", background: "rgba(255,255,255,0.04)", color: "#4b5563", fontSize: "0.62rem", cursor: "pointer" }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addFile()} placeholder="new_file.py" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "5px 9px", color: "#e5e7eb", fontSize: "0.7rem", outline: "none", fontFamily: "monospace" }} />
              <button onClick={addFile} style={{ padding: "5px 10px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 7, color: "#6ee7b7", fontSize: "0.7rem", cursor: "pointer" }}>+ Add</button>
            </div>
          </div>

          {activeFile && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "5px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.65rem", color: "#6b7280", fontFamily: "monospace" }}>{activeFile}</div>
              <textarea value={files[activeFile] || ""} onChange={e => setFiles(f => ({ ...f, [activeFile]: e.target.value }))} style={{ width: "100%", minHeight: 200, background: "#0d1117", border: "none", padding: "0.875rem", color: "#c9d1d9", fontSize: "0.73rem", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }} />
            </div>
          )}

          <button onClick={handleGenerate} disabled={loading} style={{ padding: "13px", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer", background: loading ? "rgba(16,185,129,0.1)" : "linear-gradient(135deg,#059669,#2563eb)", color: loading ? "#6b7280" : "white" }}>
            {loading ? "Running all engines..." : "📊 Generate Intelligence Report →"}
          </button>

          {error && <div style={{ padding: "0.875rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 10, color: "#fca5a5", fontSize: "0.78rem" }}>{error}</div>}

          {/* What this runs */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "0.875rem" }}>
            <div style={{ fontSize: "0.62rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>Engines running in parallel</div>
            {[["🔬", "pylint + bandit + flake8"], ["🧬", "AST taint flow analysis"], ["⧉", "Jaccard duplicate detection"], ["⚡", "O(n²) performance patterns"], ["🕸️", "Cross-file knowledge graph"], ["🔒", "Confidence-scored security"]].map(([icon, label]) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "0.8rem" }}>{icon}</span>
                <span style={{ fontSize: "0.7rem", color: "#6b7280" }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: report */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 600 }}>
          {!report && !loading && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.12 }}>📊</div>
              <p style={{ fontSize: "0.85rem", color: "#4b5563" }}>Add files and generate the report</p>
              <p style={{ fontSize: "0.72rem", color: "#374151", marginTop: "0.4rem" }}>6 engines run simultaneously — results in ~10s</p>
            </div>
          )}

          {loading && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem", padding: "3rem" }}>
              <div style={{ width: 44, height: 44, border: "3px solid rgba(16,185,129,0.2)", borderTop: "3px solid #10b981", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", width: "100%", maxWidth: 320 }}>
                {[["🔬", "Static analysis (pylint + bandit + flake8)"], ["🧬", "Taint flow tracking"], ["⧉", "Duplicate detection"], ["⚡", "Performance patterns"], ["🕸️", "Knowledge graph"], ["🤖", "AI executive summary"]].map(([icon, label]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.85rem" }}>{icon}</span>
                    <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {/* Tab bar + export */}
              <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 1rem", flexWrap: "wrap", gap: "0" }}>
                <div style={{ display: "flex", flex: 1 }}>
                  {TABS.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "0.75rem 0.875rem", background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid #10b981" : "2px solid transparent", color: activeTab === tab ? "#6ee7b7" : "#6b7280", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", textTransform: "capitalize", whiteSpace: "nowrap" }}>{tab}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", padding: "0.5rem 0" }}>
                  <button onClick={handleExportMd} style={{ padding: "5px 12px", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.25)", borderRadius: 7, color: "#93c5fd", fontSize: "0.7rem", cursor: "pointer" }}>⬇ MD</button>
                  <button onClick={handleExportPdf} style={{ padding: "5px 12px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 7, color: "#fca5a5", fontSize: "0.7rem", cursor: "pointer" }}>⬇ PDF</button>
                </div>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
                {activeTab === "overview"    && <OverviewTab    report={report} />}
                {activeTab === "security"    && <SecurityTab    report={report} />}
                {activeTab === "files"       && <FilesTab       report={report} />}
                {activeTab === "graph"       && <GraphTab       report={report} />}
                {activeTab === "ai summary"  && <AiSummaryTab   report={report} />}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Tab components ────────────────────────────────────────────────────────────

function OverviewTab({ report }) {
  const s = report.summary;
  const g = report.graph;
  const RISK_LEVEL = s.taint_paths > 0 ? { label: "CRITICAL", color: "#ef4444" } : s.total_security > 2 ? { label: "HIGH", color: "#f97316" } : s.total_bugs > 3 ? { label: "MEDIUM", color: "#f59e0b" } : { label: "LOW", color: "#10b981" };

  return (
    <div>
      {/* Score hero */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "1.5rem", marginBottom: "1.5rem", alignItems: "center" }}>
        <div style={{ textAlign: "center", background: "rgba(255,255,255,0.03)", border: `2px solid ${scoreColor(s.avg_score)}44`, borderRadius: 16, padding: "1.25rem 1.75rem" }}>
          <div style={{ fontSize: "3rem", fontWeight: 900, color: scoreColor(s.avg_score), lineHeight: 1 }}>{s.avg_score}</div>
          <div style={{ fontSize: "0.65rem", color: "#6b7280", marginTop: "4px" }}>/ 10</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: GRADE_COLOR[s.avg_grade] || "#9ca3af", marginTop: "4px" }}>{s.avg_grade}</div>
          <div style={{ fontSize: "0.6rem", color: "#4b5563", marginTop: "2px" }}>avg quality</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
          {[["Files", s.files_analyzed, "#6366f1"], ["Lines", s.total_lines, "#3b82f6"], ["Functions", s.total_functions, "#8b5cf6"], ["Classes", s.total_classes, "#06b6d4"], ["Bugs", s.total_bugs, "#ef4444"], ["Security", s.total_security, "#f97316"], ["Taint Paths", s.taint_paths, s.taint_paths > 0 ? "#ef4444" : "#10b981"], ["Duplicates", s.duplicate_groups, s.duplicate_groups > 0 ? "#f59e0b" : "#10b981"]].map(([label, val, color]) => (
            <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 9, padding: "0.6rem 0.875rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.7rem", color: "#6b7280" }}>{label}</span>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: color }}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Risk badge */}
      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", padding: "6px 14px", borderRadius: 8, background: `${RISK_LEVEL.color}18`, border: `1px solid ${RISK_LEVEL.color}44`, marginBottom: "1.25rem" }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: RISK_LEVEL.color }} />
        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: RISK_LEVEL.color }}>Overall Risk: {RISK_LEVEL.label}</span>
      </div>

      {/* Graph stats */}
      {g && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "0.875rem", marginBottom: "1rem" }}>
          <div style={{ fontSize: "0.62rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>Code Graph</div>
          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            {[["Nodes", g.stats?.total_nodes], ["Edges", g.stats?.total_edges], ["Functions", g.stats?.functions], ["Classes", g.stats?.classes]].map(([l, v]) => (
              <div key={l} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#a5b4fc" }}>{v ?? "—"}</div>
                <div style={{ fontSize: "0.62rem", color: "#6b7280" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function SecurityTab({ report }) {
  const taint = report.taint?.data_flow_issues || [];
  const confidence = report.confidence || [];
  const RISK_COLORS = { "SQL Injection": "#ef4444", "Command Injection": "#f97316", "Code Injection": "#a855f7", "Path Traversal": "#f59e0b", "Insecure Deserialization": "#6366f1" };

  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>Taint Flow Paths</div>
      {!taint.length && <p style={{ color: "#10b981", fontSize: "0.82rem", marginBottom: "1rem" }}>✓ No taint paths detected</p>}
      {taint.map((issue, i) => {
        const c = RISK_COLORS[issue.risk] || "#6b7280";
        return (
          <div key={i} style={{ background: `${c}10`, border: `1px solid ${c}33`, borderRadius: 12, padding: "0.875rem", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: c }}>⚠ {issue.risk}</span>
              <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>line {issue.line}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", color: "#fca5a5", fontFamily: "monospace" }}>{issue.source}</span>
              <span style={{ color: "#374151" }}>→</span>
              <span style={{ background: "rgba(255,255,255,0.06)", borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", color: "#e5e7eb", fontFamily: "monospace" }}>{issue.variable}</span>
              <span style={{ color: "#374151" }}>→</span>
              <span style={{ background: `${c}18`, border: `1px solid ${c}44`, borderRadius: 6, padding: "2px 8px", fontSize: "0.72rem", color: c, fontFamily: "monospace" }}>{issue.sink}</span>
            </div>
          </div>
        );
      })}

      {confidence.length > 0 && (
        <>
          <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", margin: "1.25rem 0 0.75rem" }}>Confidence-Scored Findings</div>
          {confidence.map((f, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.875rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, marginBottom: "0.35rem" }}>
              <span style={{ fontSize: "0.75rem", color: "#d1d5db" }}>{f.issue}</span>
              <span style={{ fontSize: "0.68rem", padding: "2px 8px", borderRadius: 5, background: f.confidence_label === "high" ? "rgba(239,68,68,0.15)" : "rgba(245,158,11,0.15)", color: f.confidence_label === "high" ? "#fca5a5" : "#fcd34d" }}>{f.confidence_label}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function FilesTab({ report }) {
  const [open, setOpen] = useState({});
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>Per-File Analysis</div>
      {Object.entries(report.files || {}).map(([filename, data]) => {
        const score = data.quality?.score;
        const sc = score >= 8 ? "#10b981" : score >= 6 ? "#3b82f6" : score >= 4 ? "#f59e0b" : "#ef4444";
        return (
          <div key={filename} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, marginBottom: "0.5rem", overflow: "hidden" }}>
            <button onClick={() => setOpen(o => ({ ...o, [filename]: !o[filename] }))} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.7rem 0.875rem", background: "none", border: "none", cursor: "pointer", color: "white" }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#93c5fd" }}>{filename}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                {score !== undefined && <span style={{ fontWeight: 700, color: sc, fontSize: "0.8rem" }}>{score}/10</span>}
                <span style={{ color: "#4b5563", fontSize: "0.65rem" }}>{open[filename] ? "▲" : "▼"}</span>
              </div>
            </button>
            {open[filename] && (
              <div style={{ padding: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                {data.quality && (
                  <div style={{ display: "flex", gap: "1rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                    {[["Bugs", data.quality.bugs, "#ef4444"], ["Security", data.quality.security_issues, "#f97316"], ["Smells", data.quality.code_smells, "#f59e0b"]].map(([l, v, c]) => (
                      <span key={l} style={{ fontSize: "0.72rem", color: "#6b7280" }}>{l}: <span style={{ color: c, fontWeight: 600 }}>{v}</span></span>
                    ))}
                  </div>
                )}
                {data.functions?.length > 0 && <p style={{ color: "#9ca3af", fontSize: "0.7rem", margin: "0 0 0.4rem" }}>Functions: {data.functions.join(", ")}</p>}
                {data.duplicates?.length > 0 && <p style={{ color: "#f59e0b", fontSize: "0.7rem", margin: "0 0 0.4rem" }}>⧉ {data.duplicates.length} duplicate group(s)</p>}
                {data.performance?.length > 0 && <p style={{ color: "#f97316", fontSize: "0.7rem", margin: 0 }}>⚡ {data.performance.length} performance issue(s)</p>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function GraphTab({ report }) {
  const g = report.graph;
  if (!g) return <p style={{ color: "#4b5563", fontSize: "0.82rem" }}>No graph data.</p>;
  const nodeTypes = { file: "#3b82f6", function: "#8b5cf6", class: "#10b981", module: "#f59e0b" };
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>Knowledge Graph — {g.stats?.total_nodes} nodes, {g.stats?.total_edges} edges</div>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {Object.entries(nodeTypes).map(([type, color]) => (
          <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "3px 10px", borderRadius: 6, background: `${color}15`, border: `1px solid ${color}33` }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: color }} />
            <span style={{ fontSize: "0.68rem", color: "#9ca3af", textTransform: "capitalize" }}>{type}</span>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
        {g.nodes?.slice(0, 60).map((node, i) => (
          <div key={i} style={{ padding: "3px 9px", borderRadius: 6, background: `${nodeTypes[node.type] || "#6b7280"}15`, border: `1px solid ${nodeTypes[node.type] || "#6b7280"}33`, fontSize: "0.68rem", color: "#9ca3af", fontFamily: "monospace" }} title={`${node.type}: ${node.file}`}>
            {node.label}
          </div>
        ))}
        {g.nodes?.length > 60 && <span style={{ fontSize: "0.68rem", color: "#4b5563" }}>+{g.nodes.length - 60} more</span>}
      </div>
    </div>
  );
}

function AiSummaryTab({ report }) {
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>AI Executive Summary</div>
      <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.25rem" }}>
        <p style={{ fontSize: "0.85rem", color: "#d1d5db", lineHeight: 1.7, margin: 0 }}>{report.ai_summary || "No AI summary generated."}</p>
      </div>
      {report.recommendations?.length > 0 && (
        <>
          <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Recommendations</div>
          {report.recommendations.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: "0.75rem", padding: "0.6rem 0.875rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, marginBottom: "0.4rem" }}>
              <span style={{ color: "#6366f1", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
              <span style={{ fontSize: "0.78rem", color: "#d1d5db" }}>{r}</span>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function buildMarkdown(report) {
  const s = report.summary;
  return `# Intelligence Report — ${report.repo_name}
Generated: ${report.generated_at}

## Summary
- Quality Score: ${s.avg_score}/10 (${s.avg_grade})
- Files: ${s.files_analyzed} | Lines: ${s.total_lines} | Functions: ${s.total_functions}
- Bugs: ${s.total_bugs} | Security: ${s.total_security} | Taint Paths: ${s.taint_paths}
- Duplicates: ${s.duplicate_groups}

## AI Summary
${report.ai_summary || "N/A"}

## Recommendations
${report.recommendations?.map((r, i) => `${i + 1}. ${r}`).join("\n") || "None"}

---
*Generated by AiCodeSage v5.0*
`;
}
