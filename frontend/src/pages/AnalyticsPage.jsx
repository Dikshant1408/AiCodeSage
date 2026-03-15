import React, { useState, useEffect } from "react";
import { getHistory, saveAnalysis, listRepos } from "../api";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AnalyticsPage() {
  const [repoName, setRepoName] = useState("my-project");
  const [history, setHistory] = useState([]);
  const [repos, setRepos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saveForm, setSaveForm] = useState({ quality_score: 7.5, bug_count: 2, security_count: 1, code_smells: 3, grade: "B", files_analyzed: 5, line_count: 300 });

  useEffect(() => {
    listRepos().then(r => setRepos(r.data.repos || [])).catch(() => {});
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    try { const r = await getHistory(repoName); setHistory(r.data.history || []); }
    catch (e) { setHistory([]); }
    setLoading(false);
  };

  const handleSave = async () => {
    try { await saveAnalysis({ repo_name: repoName, ...saveForm }); await loadHistory(); }
    catch (e) { alert(e.message); }
  };

  const maxScore = Math.max(...history.map(h => h.quality_score), 10);
  const GRADE_COLOR = { "A+": "#34d399", A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#f97316", F: "#ef4444" };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div className="glass" style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>📈</div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Quality Analytics</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "4px 0 0" }}>Track repository health over time — quality score trends, bug density, security issues</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: "1.5rem" }}>
        {/* Left */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="glass" style={{ borderRadius: 16, padding: "1rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Repository</div>
            <input value={repoName} onChange={e => setRepoName(e.target.value)}
              placeholder="my-project"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "8px 12px", color: "#e5e7eb", fontSize: "0.8rem", outline: "none", boxSizing: "border-box", marginBottom: "0.5rem" }} />
            {repos.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem", marginBottom: "0.5rem" }}>
                {repos.slice(0, 6).map(r => (
                  <button key={r} onClick={() => setRepoName(r)} style={{ padding: "2px 8px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#9ca3af", fontSize: "0.7rem", cursor: "pointer" }}>{r.slice(0, 12)}</button>
                ))}
              </div>
            )}
            <button onClick={loadHistory} disabled={loading}
              style={{ width: "100%", padding: "9px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 10, color: "#93c5fd", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem" }}>
              {loading ? "Loading..." : "📊 Load History"}
            </button>
          </div>

          <div className="glass" style={{ borderRadius: 16, padding: "1rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Save Analysis Snapshot</div>
            {[
              ["quality_score", "Quality Score (0-10)", "number"],
              ["bug_count", "Bug Count", "number"],
              ["security_count", "Security Issues", "number"],
              ["code_smells", "Code Smells", "number"],
              ["grade", "Grade (A/B/C/D/F)", "text"],
              ["files_analyzed", "Files Analyzed", "number"],
            ].map(([key, label, type]) => (
              <div key={key} style={{ marginBottom: "0.5rem" }}>
                <div style={{ fontSize: "0.65rem", color: "#6b7280", marginBottom: "2px" }}>{label}</div>
                <input type={type} value={saveForm[key]} onChange={e => setSaveForm(f => ({ ...f, [key]: type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }))}
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "5px 10px", color: "#e5e7eb", fontSize: "0.78rem", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}
            <button onClick={handleSave}
              style={{ width: "100%", padding: "9px", background: "linear-gradient(135deg,#059669,#2563eb)", border: "none", borderRadius: 10, color: "white", fontWeight: 600, cursor: "pointer", fontSize: "0.85rem", marginTop: "0.5rem" }}>
              💾 Save Snapshot
            </button>
          </div>
        </div>

        {/* Right: Charts */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {history.length === 0 ? (
            <div className="glass" style={{ borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", color: "#4b5563", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.3 }}>📈</div>
              <p style={{ fontSize: "0.875rem" }}>Load a repository's history to see trends</p>
              <p style={{ fontSize: "0.75rem", color: "#374151", marginTop: "0.5rem" }}>Save analysis snapshots to build up history</p>
            </div>
          ) : (
            <>
              {/* Quality Score Line Chart */}
              <div className="glass" style={{ borderRadius: 16, padding: "1.25rem" }}>
                <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Quality Score Trend</div>
                <ResponsiveContainer width="100%" height={140}>
                  <LineChart data={[...history].reverse().slice(-20).map(h => ({ date: h.timestamp?.slice(0, 10), score: h.quality_score }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" tick={{ fill: "#4b5563", fontSize: 10 }} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fill: "#4b5563", fontSize: 10 }} tickLine={false} />
                    <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#9ca3af" }} />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6", r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Bug + Security bar charts */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Bug Count Trend</div>
                  <ResponsiveContainer width="100%" height={90}>
                    <BarChart data={[...history].reverse().slice(-12).map(h => ({ date: h.timestamp?.slice(5, 10), bugs: h.bug_count }))}>
                      <XAxis dataKey="date" tick={{ fill: "#4b5563", fontSize: 9 }} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid #374151", borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="bugs" fill="#ef4444" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Security Issues Trend</div>
                  <ResponsiveContainer width="100%" height={90}>
                    <BarChart data={[...history].reverse().slice(-12).map(h => ({ date: h.timestamp?.slice(5, 10), security: h.security_count }))}>
                      <XAxis dataKey="date" tick={{ fill: "#4b5563", fontSize: 9 }} tickLine={false} />
                      <Tooltip contentStyle={{ background: "#0d1117", border: "1px solid #374151", borderRadius: 8, fontSize: 11 }} />
                      <Bar dataKey="security" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* History table */}
              <div className="glass" style={{ borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em" }}>History ({history.length} snapshots)</div>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                        {["Date", "Score", "Grade", "Bugs", "Security", "Smells", "Files"].map(h => (
                          <th key={h} style={{ padding: "8px 12px", textAlign: "left", color: "#6b7280", fontWeight: 500 }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((h, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                          <td style={{ padding: "8px 12px", color: "#9ca3af" }}>{h.timestamp?.slice(0, 10)}</td>
                          <td style={{ padding: "8px 12px", color: h.quality_score >= 7 ? "#10b981" : h.quality_score >= 5 ? "#f59e0b" : "#ef4444", fontWeight: 600 }}>{h.quality_score?.toFixed(1)}</td>
                          <td style={{ padding: "8px 12px", color: GRADE_COLOR[h.grade] || "#9ca3af" }}>{h.grade}</td>
                          <td style={{ padding: "8px 12px", color: "#ef4444" }}>{h.bug_count}</td>
                          <td style={{ padding: "8px 12px", color: "#f59e0b" }}>{h.security_count}</td>
                          <td style={{ padding: "8px 12px", color: "#9ca3af" }}>{h.code_smells}</td>
                          <td style={{ padding: "8px 12px", color: "#9ca3af" }}>{h.files_analyzed}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
