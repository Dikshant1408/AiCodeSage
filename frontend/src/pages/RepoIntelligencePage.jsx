import React, { useState, useRef } from "react";
import { analyzeRepoZip, analyzeRepoGithub } from "../api";

const SEV_COLOR  = { critical:"#ef4444", high:"#f97316", medium:"#f59e0b", low:"#6b7280", info:"#6366f1" };
const LANG_COLOR = { python:"#3b82f6", javascript:"#f59e0b", typescript:"#6366f1", java:"#ef4444", css:"#10b981", html:"#f97316", sql:"#8b5cf6", jsx:"#f59e0b", tsx:"#6366f1", other:"#6b7280" };
const sc = s => s >= 8 ? "#10b981" : s >= 6 ? "#6366f1" : s >= 4 ? "#f59e0b" : "#ef4444";

export default function RepoIntelligencePage() {
  const [mode, setMode]       = useState("zip");
  const [file, setFile]       = useState(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const reportRef = useRef(null);

  const run = async () => {
    setLoading(true); setError(null); setResult(null);
    try {
      const res = mode === "zip"
        ? await analyzeRepoZip(file)
        : await analyzeRepoGithub(githubUrl);
      if (res.data.error) { setError(res.data.error); }
      else { setResult(res.data); setTimeout(() => reportRef.current?.scrollIntoView({ behavior: "smooth" }), 100); }
    } catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  };

  const exportMarkdown = () => {
    if (!result) return;
    const md = buildMarkdown(result);
    const blob = new Blob([md], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${result.repo_name || "project"}-report.md`;
    a.click();
  };

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ margin: "0 0 0.4rem", fontSize: "1.8rem", fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Project Report
        </h1>
        <p style={{ margin: 0, color: "#6b7280", fontSize: "0.85rem" }}>
          Upload your project — get a full developer report: what it is, every issue, how to fix each one, and what to improve next.
        </p>
      </div>

      {/* Upload card */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {["zip", "github"].map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ padding: "7px 18px", borderRadius: 8, border: `1px solid ${mode === m ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`, background: mode === m ? "rgba(99,102,241,0.15)" : "transparent", color: mode === m ? "#a5b4fc" : "#6b7280", fontSize: "0.82rem", fontWeight: mode === m ? 700 : 400, cursor: "pointer" }}>
              {m === "zip" ? "📦 Upload ZIP" : "🐙 GitHub URL"}
            </button>
          ))}
        </div>

        {mode === "zip" ? (
          <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
            <input type="file" accept=".zip" id="proj-zip" style={{ display: "none" }} onChange={e => { setFile(e.target.files[0]); setResult(null); }} />
            <label htmlFor="proj-zip" style={{ padding: "9px 20px", borderRadius: 9, cursor: "pointer", fontSize: "0.82rem", color: file ? "#34d399" : "#9ca3af", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {file ? `✓ ${file.name}` : "Choose ZIP file"}
            </label>
            <span style={{ fontSize: "0.72rem", color: "#4b5563" }}>Supports .py .js .ts .jsx .tsx .java .css .html .sql — skips node_modules, venv, dist</span>
          </div>
        ) : (
          <input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/username/repo"
            style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 9, padding: "10px 14px", color: "#e5e7eb", fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }} />
        )}

        <button onClick={run} disabled={loading || (mode === "zip" ? !file : !githubUrl)}
          style={{ marginTop: "1rem", padding: "11px 28px", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer", background: loading ? "rgba(99,102,241,0.15)" : "linear-gradient(135deg,#4f46e5,#7c3aed)", color: loading ? "#6b7280" : "white" }}>
          {loading ? "Analyzing project..." : "Generate Report →"}
        </button>

        {error && <div style={{ marginTop: "1rem", padding: "0.875rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 10, color: "#fca5a5", fontSize: "0.82rem" }}>{error}</div>}
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
          <div style={{ width: 44, height: 44, border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }} />
          <p style={{ fontSize: "0.85rem" }}>Reading your project, running analysis, generating report...</p>
          <p style={{ fontSize: "0.75rem", color: "#374151", marginTop: "0.4rem" }}>This takes 15–30 seconds for a full project</p>
        </div>
      )}

      {/* THE REPORT */}
      {result && (
        <div ref={reportRef}>
          {/* Export button */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1.5rem" }}>
            <button onClick={exportMarkdown} style={{ padding: "8px 18px", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 9, color: "#a5b4fc", fontSize: "0.8rem", cursor: "pointer", fontWeight: 600 }}>
              ⬇ Export Report (.md)
            </button>
          </div>

          <ProjectSummarySection r={result} />
          <HealthSection r={result} />
          <IssuesSection r={result} />
          <ImprovementsSection r={result} />
          <FilesSection r={result} />
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Section 1: What is this project ─────────────────────────────────────────
function ProjectSummarySection({ r }) {
  const s = r.project_summary;
  if (!s) return null;

  // Simple robust parser — splits on section headers regardless of markdown formatting
  const parseSection = (text, key) => {
    if (!text) return "";
    const lines = text.split("\n");
    let capturing = false;
    const result = [];
    const headerPattern = /^[\*\s]*(WHAT IT IS|WHAT IT DOES|HOW IT WORKS|TECH STACK|PROJECT STRUCTURE|CURRENT STATE|WHAT TO BUILD NEXT)[\*\s]*:?/i;

    for (const line of lines) {
      const isHeader = headerPattern.test(line.trim());
      const isThisHeader = new RegExp(`^[\\*\\s]*${key}[\\*\\s]*:?`, "i").test(line.trim());

      if (isThisHeader) { capturing = true; continue; }
      if (isHeader && capturing) break;
      if (capturing) result.push(line);
    }
    return result.join("\n").replace(/\*\*/g, "").trim();
  };

  const ai = s.ai_summary || "";
  const whatItIs     = parseSection(ai, "WHAT IT IS");
  const whatItDoes   = parseSection(ai, "WHAT IT DOES");
  const howItWorks   = parseSection(ai, "HOW IT WORKS");
  const techStack    = parseSection(ai, "TECH STACK");
  const structure    = parseSection(ai, "PROJECT STRUCTURE");
  const currentState = parseSection(ai, "CURRENT STATE");
  const whatNext     = parseSection(ai, "WHAT TO BUILD NEXT");

  // Fallback: if parsing failed, show the raw summary
  const showRaw = !whatItIs && !whatItDoes && ai.length > 20;

  return (
    <div style={{ marginBottom: "2rem" }}>
      <SectionHeader icon="📋" title="What is this project?" />
      <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 14, padding: "1.5rem" }}>
        {/* Project name + type */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, fontSize: "1.3rem", fontWeight: 800, color: "#e5e7eb" }}>{s.project_name}</h2>
          <span style={{ fontSize: "0.75rem", padding: "3px 12px", borderRadius: 6, background: "rgba(99,102,241,0.2)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.3)" }}>{s.project_type}</span>
        </div>

        {/* Stack badges */}
        {s.stack?.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "1.25rem" }}>
            {s.stack.map(tech => (
              <span key={tech} style={{ fontSize: "0.75rem", padding: "3px 10px", borderRadius: 6, background: `${LANG_COLOR[tech.toLowerCase()] || "#6b7280"}18`, color: LANG_COLOR[tech.toLowerCase()] || "#9ca3af", border: `1px solid ${LANG_COLOR[tech.toLowerCase()] || "#6b7280"}33` }}>{tech}</span>
            ))}
          </div>
        )}

        {/* AI narrative */}
        {showRaw && <p style={{ margin: "0 0 0.75rem", fontSize: "0.88rem", color: "#d1d5db", lineHeight: 1.7, whiteSpace: "pre-line" }}>{ai.replace(/\*\*/g, "")}</p>}
        {!showRaw && whatItIs && <p style={{ margin: "0 0 0.75rem", fontSize: "1rem", color: "#e5e7eb", fontWeight: 500, lineHeight: 1.5 }}>{whatItIs}</p>}
        {!showRaw && whatItDoes && <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: "#9ca3af", lineHeight: 1.6 }}>{whatItDoes}</p>}
        {!showRaw && howItWorks && <p style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#9ca3af", lineHeight: 1.6 }}>{howItWorks}</p>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "0.75rem" }}>
          {!showRaw && techStack && (
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "0.875rem" }}>
              <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>Tech Stack</div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#d1d5db", lineHeight: 1.6, whiteSpace: "pre-line" }}>{techStack}</p>
            </div>
          )}
          {!showRaw && structure && (
            <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "0.875rem" }}>
              <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>Project Structure</div>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "#d1d5db", lineHeight: 1.6, whiteSpace: "pre-line" }}>{structure}</p>
            </div>
          )}
        </div>

        {!showRaw && currentState && (
          <div style={{ marginTop: "1rem", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "0.875rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>Current State</div>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#fcd34d", lineHeight: 1.5, whiteSpace: "pre-line" }}>{currentState}</p>
          </div>
        )}

        {!showRaw && whatNext && (
          <div style={{ marginTop: "1rem", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 10, padding: "0.875rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#10b981", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.4rem" }}>What to Build Next</div>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#6ee7b7", lineHeight: 1.6, whiteSpace: "pre-line" }}>{whatNext}</p>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: "flex", gap: "1.5rem", marginTop: "1.25rem", flexWrap: "wrap" }}>
          {[["Files", s.file_count], ["Lines of Code", s.total_lines?.toLocaleString()]].map(([l, v]) => (
            <div key={l}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e5e7eb" }}>{v}</span>
              <span style={{ fontSize: "0.72rem", color: "#6b7280", marginLeft: "0.4rem" }}>{l}</span>
            </div>
          ))}
          {s.languages && Object.entries(s.languages).slice(0, 4).map(([lang, count]) => (
            <div key={lang}>
              <span style={{ fontSize: "1.1rem", fontWeight: 700, color: LANG_COLOR[lang] || "#9ca3af" }}>{count}</span>
              <span style={{ fontSize: "0.72rem", color: "#6b7280", marginLeft: "0.4rem" }}>.{lang} files</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Section 2: Health overview ───────────────────────────────────────────────
function HealthSection({ r }) {
  const totalIssues = r.detailed_issues?.length || 0;
  const critical    = r.detailed_issues?.filter(i => i.severity === "critical").length || 0;
  const high        = r.detailed_issues?.filter(i => i.severity === "high").length || 0;
  const taintPaths  = r.cross_file_taint?.length || 0;
  const deadCode    = r.dead_functions?.length || 0;

  const healthColor = r.avg_quality_score >= 8 ? "#10b981" : r.avg_quality_score >= 6 ? "#6366f1" : r.avg_quality_score >= 4 ? "#f59e0b" : "#ef4444";
  const healthLabel = r.avg_quality_score >= 8 ? "Good" : r.avg_quality_score >= 6 ? "Fair" : r.avg_quality_score >= 4 ? "Needs Work" : "Poor";

  return (
    <div style={{ marginBottom: "2rem" }}>
      <SectionHeader icon="🏥" title="Project Health" />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "0.75rem" }}>
        {[
          ["Overall Score", `${r.avg_quality_score}/10`, healthColor, healthLabel],
          ["Total Issues", totalIssues, totalIssues > 20 ? "#ef4444" : totalIssues > 10 ? "#f59e0b" : "#10b981", "found"],
          ["Critical", critical, critical > 0 ? "#ef4444" : "#10b981", "must fix"],
          ["High Priority", high, high > 0 ? "#f97316" : "#10b981", "should fix"],
          ["Security Paths", taintPaths, taintPaths > 0 ? "#ef4444" : "#10b981", "injection risks"],
          ["Dead Code", deadCode, deadCode > 5 ? "#f59e0b" : "#6b7280", "unused functions"],
        ].map(([label, val, color, sub]) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color }}>{val}</div>
            <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: "2px" }}>{label}</div>
            <div style={{ fontSize: "0.62rem", color: "#4b5563", marginTop: "1px" }}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section 3: Every issue with fix ─────────────────────────────────────────
function IssuesSection({ r }) {
  const [filter, setFilter] = useState("all");
  const [expanded, setExpanded] = useState({});
  const issues = r.detailed_issues || [];

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  issues.forEach(i => { if (counts[i.severity] !== undefined) counts[i.severity]++; });

  const filtered = filter === "all" ? issues : issues.filter(i => i.severity === filter);

  if (!issues.length) return null;

  return (
    <div style={{ marginBottom: "2rem" }}>
      <SectionHeader icon="🐛" title={`Issues Found (${issues.length})`} />

      {/* Filter */}
      <div style={{ display: "flex", gap: "0.4rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {[["all", "All", issues.length], ["critical", "Critical", counts.critical], ["high", "High", counts.high], ["medium", "Medium", counts.medium], ["low", "Low", counts.low]].map(([val, label, count]) => (
          count > 0 || val === "all" ? (
            <button key={val} onClick={() => setFilter(val)} style={{ padding: "5px 12px", borderRadius: 7, border: `1px solid ${filter === val ? (SEV_COLOR[val] || "#6366f1") : "rgba(255,255,255,0.08)"}`, background: filter === val ? `${SEV_COLOR[val] || "#6366f1"}18` : "rgba(255,255,255,0.03)", color: filter === val ? (SEV_COLOR[val] || "#a5b4fc") : "#6b7280", fontSize: "0.75rem", cursor: "pointer", fontWeight: filter === val ? 700 : 400 }}>
              {label} {count}
            </button>
          ) : null
        ))}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {filtered.map((issue, i) => (
          <div key={i} style={{ background: `${SEV_COLOR[issue.severity] || "#6b7280"}08`, border: `1px solid ${SEV_COLOR[issue.severity] || "#6b7280"}22`, borderRadius: 10, overflow: "hidden" }}>
            <button onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem 1rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              <span style={{ fontSize: "0.62rem", padding: "2px 7px", borderRadius: 4, background: `${SEV_COLOR[issue.severity]}22`, color: SEV_COLOR[issue.severity], border: `1px solid ${SEV_COLOR[issue.severity]}44`, fontWeight: 700, flexShrink: 0 }}>{issue.severity}</span>
              <span style={{ flex: 1, fontSize: "0.82rem", color: "#e5e7eb" }}>{issue.message}</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "#6b7280", flexShrink: 0 }}>{issue.file.split("/").pop()}:{issue.line}</span>
              <span style={{ color: "#4b5563", fontSize: "0.7rem", flexShrink: 0 }}>{expanded[i] ? "▲" : "▼"}</span>
            </button>
            {expanded[i] && (
              <div style={{ padding: "0 1rem 0.875rem", borderTop: `1px solid ${SEV_COLOR[issue.severity]}18` }}>
                <div style={{ fontSize: "0.72rem", color: "#6b7280", marginBottom: "0.5rem", fontFamily: "monospace" }}>{issue.file}:{issue.line} · {issue.code} · {issue.tool}</div>
                <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 8, padding: "0.6rem 0.875rem" }}>
                  <span style={{ fontSize: "0.65rem", color: "#818cf8", fontWeight: 700 }}>HOW TO FIX → </span>
                  <span style={{ fontSize: "0.78rem", color: "#c7d2fe" }}>{issue.fix_hint}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section 4: What to improve ───────────────────────────────────────────────
function ImprovementsSection({ r }) {
  const [expanded, setExpanded] = useState({ 0: true });
  const improvements = r.improvements || [];
  if (!improvements.length) return null;

  const CAT_COLOR = { security:"#ef4444", reliability:"#f97316", performance:"#f59e0b", maintainability:"#6366f1", architecture:"#8b5cf6" };
  const IMPACT_COLOR = { low:"#6b7280", medium:"#3b82f6", high:"#f97316", critical:"#ef4444" };

  return (
    <div style={{ marginBottom: "2rem" }}>
      <SectionHeader icon="🚀" title={`What to Improve (${improvements.length} recommendations)`} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {improvements.map((imp, i) => {
          const cc = CAT_COLOR[imp.category] || "#6b7280";
          const open = expanded[i];
          return (
            <div key={i} style={{ background: `${cc}06`, border: `1px solid ${cc}22`, borderRadius: 12, overflow: "hidden" }}>
              <button onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))} style={{ width: "100%", display: "flex", alignItems: "center", gap: "0.875rem", padding: "1rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: `${cc}22`, border: `1px solid ${cc}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800, color: cc, flexShrink: 0 }}>{imp.priority}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#e5e7eb", marginBottom: "0.2rem" }}>{imp.title}</div>
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <span style={{ fontSize: "0.62rem", padding: "1px 7px", borderRadius: 4, background: `${cc}18`, color: cc, textTransform: "capitalize" }}>{imp.category}</span>
                    <span style={{ fontSize: "0.62rem", padding: "1px 7px", borderRadius: 4, background: `${IMPACT_COLOR[imp.impact]}18`, color: IMPACT_COLOR[imp.impact] }}>impact: {imp.impact}</span>
                    <span style={{ fontSize: "0.62rem", color: "#4b5563" }}>effort: {imp.effort}</span>
                  </div>
                </div>
                <span style={{ color: "#4b5563", fontSize: "0.7rem", flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
              </button>
              {open && (
                <div style={{ padding: "0 1rem 1rem", borderTop: `1px solid ${cc}15` }}>
                  <p style={{ margin: "0 0 0.75rem", fontSize: "0.82rem", color: "#d1d5db", lineHeight: 1.6, whiteSpace: "pre-line" }}>{imp.description}</p>
                  <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "0.6rem 0.875rem", marginBottom: "0.75rem" }}>
                    <div style={{ fontSize: "0.62rem", color: "#ef4444", fontWeight: 700, marginBottom: "0.2rem" }}>WHY IT MATTERS</div>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#fca5a5", lineHeight: 1.5 }}>{imp.why_it_matters}</p>
                  </div>
                  <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "0.6rem 0.875rem" }}>
                    <div style={{ fontSize: "0.62rem", color: "#818cf8", fontWeight: 700, marginBottom: "0.2rem" }}>HOW TO FIX</div>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#c7d2fe", lineHeight: 1.6, whiteSpace: "pre-line" }}>{imp.how_to_fix}</p>
                  </div>
                  {imp.affected_lines?.length > 0 && (
                    <div style={{ marginTop: "0.75rem", display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                      {imp.affected_lines.map((loc, j) => (
                        <span key={j} style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "#93c5fd", background: "rgba(147,197,253,0.08)", padding: "2px 8px", borderRadius: 5 }}>{loc}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Section 5: File breakdown ────────────────────────────────────────────────
function FilesSection({ r }) {
  const files = r.file_scores || [];
  if (!files.length) return null;
  return (
    <div style={{ marginBottom: "2rem" }}>
      <SectionHeader icon="📁" title="File Breakdown" />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        {files.map((f, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.55rem 0.875rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8 }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#93c5fd", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.file}</span>
            <span style={{ fontSize: "0.62rem", padding: "1px 6px", borderRadius: 4, background: `${LANG_COLOR[f.lang] || "#6b7280"}18`, color: LANG_COLOR[f.lang] || "#6b7280" }}>{f.lang}</span>
            {f.issues?.length > 0 && <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>{f.issues[0]}</span>}
            <span style={{ fontWeight: 700, fontSize: "0.82rem", color: sc(f.score), flexShrink: 0 }}>{f.score}/10</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Shared ───────────────────────────────────────────────────────────────────
function SectionHeader({ icon, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1rem", paddingBottom: "0.6rem", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
      <span style={{ fontSize: "1.1rem" }}>{icon}</span>
      <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#e5e7eb" }}>{title}</h2>
    </div>
  );
}

// ── Markdown export ──────────────────────────────────────────────────────────
function buildMarkdown(r) {
  const s = r.project_summary;
  const issues = r.detailed_issues || [];
  const improvements = r.improvements || [];
  const files = r.file_scores || [];

  const sev_counts = { critical: 0, high: 0, medium: 0, low: 0 };
  issues.forEach(i => { if (sev_counts[i.severity] !== undefined) sev_counts[i.severity]++; });

  return `# Project Report — ${r.repo_name || "Project"}
Generated: ${new Date().toISOString().slice(0, 10)}

---

## What is this project?

**Name:** ${s?.project_name || r.repo_name}
**Type:** ${s?.project_type || "Application"}
**Stack:** ${s?.stack?.join(", ") || "Unknown"}
**Files:** ${s?.file_count || r.total_files} | **Lines:** ${(s?.total_lines || r.total_lines)?.toLocaleString()}

${s?.ai_summary || ""}

---

## Project Health

| Metric | Value |
|--------|-------|
| Overall Score | ${r.avg_quality_score}/10 (${r.avg_grade}) |
| Total Issues | ${issues.length} |
| Critical | ${sev_counts.critical} |
| High | ${sev_counts.high} |
| Security Paths | ${r.cross_file_taint?.length || 0} |
| Dead Code | ${r.dead_functions?.length || 0} functions |

---

## Issues Found (${issues.length})

${issues.map(i => `### ${i.severity.toUpperCase()}: ${i.message}
- **File:** \`${i.file}:${i.line}\`
- **Code:** ${i.code} (${i.tool})
- **How to fix:** ${i.fix_hint}
`).join("\n")}

---

## What to Improve

${improvements.map(imp => `### ${imp.priority}. ${imp.title}
**Category:** ${imp.category} | **Impact:** ${imp.impact} | **Effort:** ${imp.effort}

${imp.description}

**Why it matters:** ${imp.why_it_matters}

**How to fix:**
${imp.how_to_fix}

${imp.affected_lines?.length ? `**Affected:** ${imp.affected_lines.join(", ")}` : ""}
`).join("\n")}

---

## File Breakdown

| File | Language | Score | Issues |
|------|----------|-------|--------|
${files.map(f => `| \`${f.file}\` | ${f.lang} | ${f.score}/10 | ${f.issues?.join("; ") || "—"} |`).join("\n")}

---
*Generated by AiCodeSage*
`;
}
