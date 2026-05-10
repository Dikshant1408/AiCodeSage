import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { listProjects, deleteProject, saveProject } from "../api";

const sc = s => s >= 8 ? "#10b981" : s >= 6 ? "#6366f1" : s >= 4 ? "#f59e0b" : "#ef4444";
const GRADE_COLOR = { "A+": "#34d399", A: "#10b981", B: "#6366f1", C: "#f59e0b", D: "#f97316", F: "#ef4444" };
const LANG_COLOR = { python:"#3b82f6", javascript:"#f59e0b", typescript:"#6366f1", react:"#61dafb", java:"#ef4444", css:"#10b981" };

export default function HistoryPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await listProjects();
      setProjects(res.data.projects || []);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Remove this project from history?")) return;
    setDeleting(id);
    try {
      await deleteProject(id);
      setProjects(p => p.filter(x => x.id !== id));
    } catch {}
    setDeleting(null);
  };

  const formatDate = (iso) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = Math.floor((now - d) / 1000);
      if (diff < 60) return "just now";
      if (diff < 3600) return `${Math.floor(diff/60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
      if (diff < 604800) return `${Math.floor(diff/86400)}d ago`;
      return d.toLocaleDateString();
    } catch { return iso?.slice(0, 10) || ""; }
  };

  const parseStack = (s) => {
    try { return typeof s === "string" ? JSON.parse(s) : (s || []); }
    catch { return []; }
  };

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "2.5rem 2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ margin: "0 0 0.4rem", fontSize: "1.8rem", fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            My Projects
          </h1>
          <p style={{ margin: 0, color: "#6b7280", fontSize: "0.82rem" }}>
            Every project you've analyzed — scores, issues, summaries, all saved per account.
          </p>
        </div>
        <Link to="/repo">
          <button style={{ padding: "9px 20px", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontSize: "0.82rem", cursor: "pointer" }}>
            + Analyze New Project
          </button>
        </Link>
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: "3rem", color: "#6b7280" }}>
          <div style={{ width: 36, height: 36, border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1rem" }} />
          <p style={{ fontSize: "0.82rem" }}>Loading your projects...</p>
        </div>
      )}

      {error && (
        <div style={{ padding: "1rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 12, color: "#fca5a5", fontSize: "0.82rem" }}>
          {error.includes("401") ? "Session expired — please sign out and sign back in." : error}
        </div>
      )}

      {!loading && !error && projects.length === 0 && (
        <div style={{ textAlign: "center", padding: "4rem 2rem", color: "#4b5563" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.2 }}>📁</div>
          <p style={{ fontSize: "0.9rem", color: "#6b7280" }}>No projects yet</p>
          <p style={{ fontSize: "0.78rem", color: "#374151", marginTop: "0.4rem" }}>Analyze a project and it will appear here automatically.</p>
          <Link to="/repo" style={{ textDecoration: "none" }}>
            <button style={{ marginTop: "1.25rem", padding: "10px 22px", background: "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, fontSize: "0.85rem", cursor: "pointer" }}>
              Analyze My First Project →
            </button>
          </Link>
        </div>
      )}

      {!loading && projects.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {projects.map(p => {
            const stack = parseStack(p.stack);
            const isOpen = expanded === p.id;
            return (
              <div key={p.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden" }}>
                {/* Row */}
                <button onClick={() => setExpanded(isOpen ? null : p.id)}
                  style={{ width: "100%", display: "flex", alignItems: "center", gap: "1rem", padding: "1rem 1.25rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
                  {/* Score circle */}
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${sc(p.avg_score)}18`, border: `2px solid ${sc(p.avg_score)}44`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 800, color: sc(p.avg_score), lineHeight: 1 }}>{p.avg_score?.toFixed(1)}</span>
                    <span style={{ fontSize: "0.5rem", color: "#6b7280" }}>/10</span>
                  </div>

                  {/* Name + meta */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#e5e7eb" }}>{p.repo_name}</span>
                      <span style={{ fontSize: "0.62rem", padding: "1px 7px", borderRadius: 4, background: `${GRADE_COLOR[p.grade] || "#6b7280"}18`, color: GRADE_COLOR[p.grade] || "#6b7280", border: `1px solid ${GRADE_COLOR[p.grade] || "#6b7280"}33` }}>{p.grade}</span>
                      {p.source === "github" && <span style={{ fontSize: "0.62rem", color: "#6b7280" }}>🐙 GitHub</span>}
                    </div>
                    <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>{p.total_files} files</span>
                      {p.issue_count > 0 && <span style={{ fontSize: "0.72rem", color: "#f97316" }}>{p.issue_count} issues</span>}
                      {p.vuln_count > 0 && <span style={{ fontSize: "0.72rem", color: "#ef4444" }}>{p.vuln_count} vulnerabilities</span>}
                      {stack.length > 0 && (
                        <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>
                          {stack.slice(0, 3).join(" · ")}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Time + actions */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexShrink: 0 }}>
                    <span style={{ fontSize: "0.68rem", color: "#4b5563" }}>{formatDate(p.created_at)}</span>
                    <button onClick={(e) => handleDelete(p.id, e)} disabled={deleting === p.id}
                      style={{ padding: "4px 8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, color: "#f87171", fontSize: "0.65rem", cursor: "pointer" }}>
                      {deleting === p.id ? "..." : "✕"}
                    </button>
                    <span style={{ color: "#4b5563", fontSize: "0.75rem" }}>{isOpen ? "▲" : "▼"}</span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                    {/* Summary */}
                    {p.summary && (
                      <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 10, padding: "0.875rem", marginTop: "0.875rem", marginBottom: "0.875rem" }}>
                        <div style={{ fontSize: "0.6rem", color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, marginBottom: "0.3rem" }}>Summary</div>
                        <p style={{ margin: 0, fontSize: "0.82rem", color: "#d1d5db", lineHeight: 1.6 }}>{p.summary}</p>
                      </div>
                    )}

                    {/* Stats grid */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "0.5rem", marginBottom: "0.875rem" }}>
                      {[
                        ["Quality", `${p.avg_score?.toFixed(1)}/10`, sc(p.avg_score)],
                        ["Grade", p.grade, GRADE_COLOR[p.grade] || "#9ca3af"],
                        ["Files", p.total_files, "#6366f1"],
                        ["Lines", p.total_lines?.toLocaleString(), "#3b82f6"],
                        ["Issues", p.issue_count, p.issue_count > 0 ? "#f97316" : "#10b981"],
                        ["Vulns", p.vuln_count, p.vuln_count > 0 ? "#ef4444" : "#10b981"],
                      ].map(([label, val, color]) => (
                        <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "0.6rem", textAlign: "center" }}>
                          <div style={{ fontSize: "1rem", fontWeight: 700, color }}>{val}</div>
                          <div style={{ fontSize: "0.6rem", color: "#6b7280", marginTop: "1px" }}>{label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Stack */}
                    {stack.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", marginBottom: "0.875rem" }}>
                        {stack.map(tech => (
                          <span key={tech} style={{ fontSize: "0.72rem", padding: "2px 9px", borderRadius: 5, background: `${LANG_COLOR[tech.toLowerCase()] || "#6b7280"}18`, color: LANG_COLOR[tech.toLowerCase()] || "#9ca3af", border: `1px solid ${LANG_COLOR[tech.toLowerCase()] || "#6b7280"}33` }}>{tech}</span>
                        ))}
                      </div>
                    )}

                    {/* GitHub link */}
                    {p.repo_url && (
                      <a href={p.repo_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", color: "#6366f1", textDecoration: "none" }}>
                        🐙 {p.repo_url}
                      </a>
                    )}

                    {/* Re-analyze button */}
                    <div style={{ marginTop: "0.875rem" }}>
                      <Link to="/repo" style={{ textDecoration: "none" }}>
                        <button style={{ padding: "7px 16px", background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)", borderRadius: 8, color: "#a5b4fc", fontSize: "0.75rem", cursor: "pointer", fontWeight: 600 }}>
                          Re-analyze this project →
                        </button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
