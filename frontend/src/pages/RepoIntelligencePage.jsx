import React, { useState } from "react";
import { analyzeRepoZip, analyzeRepoGithub, getRecurringIssues } from "../api";

const sc = s => s >= 8 ? "#10b981" : s >= 6 ? "#6366f1" : s >= 4 ? "#f59e0b" : "#ef4444";
const RISK_COLOR = { critical: "#ef4444", high: "#f97316", medium: "#f59e0b", low: "#10b981", info: "#6366f1" };
const LAYER_COLOR = { controller: "#6366f1", model: "#10b981", service: "#3b82f6", util: "#8b5cf6", test: "#06b6d4", config: "#f59e0b", unknown: "#6b7280" };

export default function RepoIntelligencePage() {
  const [tab, setTab]         = useState("upload");  // upload | github | recurring
  const [file, setFile]       = useState(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [repoName, setRepoName]   = useState("");
  const [result, setResult]   = useState(null);
  const [recurring, setRecurring] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [activeSection, setActiveSection] = useState("overview");

  const SECTIONS = ["overview", "issues", "improvements", "taint", "complexity", "duplicates", "coupling", "dead code", "architecture", "recurring"];

  const runZip = async () => {
    if (!file) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await analyzeRepoZip(file);
      setResult(res.data);
      setActiveSection("issues");
      if (res.data.repo_name) {
        const rec = await getRecurringIssues(res.data.repo_name).catch(() => null);
        if (rec) setRecurring(rec.data);
      }
    } catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  };

  const runGithub = async () => {
    if (!githubUrl) return;
    setLoading(true); setError(null); setResult(null);
    try {
      const res = await analyzeRepoGithub(githubUrl);
      setResult(res.data);
      setActiveSection("issues");
      if (res.data.repo_name) {
        const rec = await getRecurringIssues(res.data.repo_name).catch(() => null);
        if (rec) setRecurring(rec.data);
      }
    } catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  };

  const runRecurring = async () => {
    if (!repoName) return;
    setLoading(true); setError(null);
    try {
      const res = await getRecurringIssues(repoName);
      setRecurring(res.data);
      setActiveSection("recurring");
    } catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>🔭</div>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Repository Intelligence</h1>
          <p style={{ margin: "3px 0 0", color: "#6b7280", fontSize: "0.82rem" }}>Cross-file taint tracking · Complexity hotspots · Dead code · Architecture layers · Recurring issues</p>
        </div>
      </div>

      {/* What AI can't do */}
      <div style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 12, padding: "0.875rem 1.25rem", marginBottom: "1.5rem", display: "flex", flexWrap: "wrap", gap: "1rem" }}>
        {[["🧬", "Cross-file taint tracking"], ["📊", "Complexity hotspot ranking"], ["⧉", "Cross-file duplicate clusters"], ["🔗", "Dependency coupling map"], ["💀", "Dead code detection"], ["🏗️", "Architecture layer detection"], ["🧠", "Recurring issue memory"]].map(([icon, label]) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span style={{ fontSize: "0.85rem" }}>{icon}</span>
            <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{label}</span>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "1.5rem" }}>
        {/* Left: input */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Tab toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "3px" }}>
            {["upload", "github", "recurring"].map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "7px 4px", borderRadius: 8, border: "none", background: tab === t ? "rgba(99,102,241,0.25)" : "transparent", color: tab === t ? "#a5b4fc" : "#6b7280", fontSize: "0.72rem", fontWeight: tab === t ? 700 : 400, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
            ))}
          </div>

          {tab === "upload" && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1rem" }}>
              <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Upload Project ZIP</div>
              <div style={{ border: "2px dashed rgba(255,255,255,0.08)", borderRadius: 10, padding: "1.25rem", textAlign: "center", marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "0.4rem", opacity: 0.3 }}>📦</div>
                <p style={{ color: "#4b5563", fontSize: "0.72rem", margin: "0 0 0.6rem" }}>.py .js .ts .jsx .tsx .java</p>
                <input type="file" accept=".zip" id="repo-zip" style={{ display: "none" }} onChange={e => { setFile(e.target.files[0]); setResult(null); }} />
                <label htmlFor="repo-zip" style={{ padding: "5px 14px", borderRadius: 7, cursor: "pointer", fontSize: "0.72rem", color: file ? "#34d399" : "#9ca3af", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  {file ? `✓ ${file.name}` : "Choose ZIP"}
                </label>
              </div>
              <button onClick={runZip} disabled={loading || !file} style={{ width: "100%", padding: "11px", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.85rem", cursor: loading || !file ? "not-allowed" : "pointer", background: loading || !file ? "rgba(99,102,241,0.1)" : "linear-gradient(135deg,#4f46e5,#7c3aed)", color: loading || !file ? "#4b5563" : "white" }}>
                {loading ? "Analyzing..." : "🔭 Analyze Repository →"}
              </button>
            </div>
          )}

          {tab === "github" && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1rem" }}>
              <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>GitHub Repository URL</div>
              <input value={githubUrl} onChange={e => setGithubUrl(e.target.value)} placeholder="https://github.com/user/repo"
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#e5e7eb", fontSize: "0.8rem", outline: "none", boxSizing: "border-box", marginBottom: "0.75rem" }} />
              <button onClick={runGithub} disabled={loading || !githubUrl} style={{ width: "100%", padding: "11px", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.85rem", cursor: loading || !githubUrl ? "not-allowed" : "pointer", background: loading || !githubUrl ? "rgba(99,102,241,0.1)" : "linear-gradient(135deg,#4f46e5,#7c3aed)", color: loading || !githubUrl ? "#4b5563" : "white" }}>
                {loading ? "Cloning & Analyzing..." : "🐙 Analyze GitHub Repo →"}
              </button>
            </div>
          )}

          {tab === "recurring" && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1rem" }}>
              <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Recurring Issue Memory</div>
              <p style={{ fontSize: "0.72rem", color: "#6b7280", marginBottom: "0.75rem", lineHeight: 1.5 }}>Enter a repo name to see which problems keep appearing across multiple analyses.</p>
              <input value={repoName} onChange={e => setRepoName(e.target.value)} placeholder="my-project"
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "9px 12px", color: "#e5e7eb", fontSize: "0.8rem", outline: "none", boxSizing: "border-box", marginBottom: "0.75rem" }} />
              <button onClick={runRecurring} disabled={loading || !repoName} style={{ width: "100%", padding: "11px", border: "none", borderRadius: 10, fontWeight: 700, fontSize: "0.85rem", cursor: loading || !repoName ? "not-allowed" : "pointer", background: loading || !repoName ? "rgba(99,102,241,0.1)" : "linear-gradient(135deg,#059669,#2563eb)", color: loading || !repoName ? "#4b5563" : "white" }}>
                {loading ? "Loading..." : "🧠 Get Recurring Issues →"}
              </button>
            </div>
          )}

          {error && <div style={{ padding: "0.875rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 10, color: "#fca5a5", fontSize: "0.78rem" }}>{error}</div>}

          {/* What this detects */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "0.875rem" }}>
            <div style={{ fontSize: "0.62rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>What AI cannot do alone</div>
            {[
              ["🧬", "Track taint across file boundaries"],
              ["📊", "Rank every function by complexity"],
              ["⧉", "Find near-duplicates across 50 files"],
              ["🔗", "Map which files are most coupled"],
              ["💀", "Find functions never called anywhere"],
              ["🧠", "Remember your repo's bad habits"],
            ].map(([icon, text]) => (
              <div key={text} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.3rem" }}>
                <span style={{ fontSize: "0.8rem", flexShrink: 0 }}>{icon}</span>
                <span style={{ fontSize: "0.68rem", color: "#6b7280", lineHeight: 1.4 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: results */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 600 }}>
          {!result && !recurring && !loading && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.12 }}>🔭</div>
              <p style={{ fontSize: "0.85rem", color: "#4b5563" }}>Upload a ZIP or enter a GitHub URL</p>
              <p style={{ fontSize: "0.72rem", color: "#374151", marginTop: "0.4rem" }}>Full repository analysis — no AI needed for most features</p>
            </div>
          )}

          {loading && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem", padding: "3rem" }}>
              <div style={{ width: 44, height: 44, border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", maxWidth: 320 }}>
                {[["🔬", "Running static analysis on all files (parallel)"], ["🧬", "Tracking taint across file boundaries"], ["📊", "Ranking complexity hotspots"], ["⧉", "Finding cross-file duplicates"], ["🔗", "Building dependency coupling map"], ["💀", "Detecting dead code"]].map(([icon, label]) => (
                  <div key={label} style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.85rem" }}>{icon}</span>
                    <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(result || recurring) && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {/* Section tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 0.5rem", overflowX: "auto" }}>
                {SECTIONS.filter(s => s !== "recurring" || recurring).map(s => (
                  <button key={s} onClick={() => setActiveSection(s)} style={{ padding: "0.75rem 0.875rem", background: "none", border: "none", borderBottom: activeSection === s ? "2px solid #6366f1" : "2px solid transparent", color: activeSection === s ? "#a5b4fc" : "#6b7280", fontSize: "0.75rem", fontWeight: 600, cursor: "pointer", textTransform: "capitalize", whiteSpace: "nowrap" }}>{s}</button>
                ))}
                {result && <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", padding: "0 0.5rem" }}>
                  <span style={{ fontSize: "0.65rem", color: "#4b5563" }}>{result.duration_sec}s · {result.total_files} files</span>
                </div>}
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
                {activeSection === "overview"      && result && <OverviewSection r={result} />}
                {activeSection === "issues"        && result && <IssuesSection r={result} />}
                {activeSection === "improvements"  && result && <ImprovementsSection r={result} />}
                {activeSection === "taint"         && result && <TaintSection r={result} />}
                {activeSection === "complexity"    && result && <ComplexitySection r={result} />}
                {activeSection === "duplicates"    && result && <DuplicatesSection r={result} />}
                {activeSection === "coupling"      && result && <CouplingSection r={result} />}
                {activeSection === "dead code"     && result && <DeadCodeSection r={result} />}
                {activeSection === "architecture"  && result && <ArchSection r={result} />}
                {activeSection === "recurring"     && recurring && <RecurringSection r={recurring} />}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function OverviewSection({ r }) {
  const langColors = { python:"#3b82f6", javascript:"#f59e0b", typescript:"#6366f1", java:"#ef4444", css:"#10b981", html:"#f97316", sql:"#8b5cf6", other:"#6b7280" };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[["Files", r.total_files, "#6366f1"], ["Functions", r.total_functions, "#8b5cf6"], ["Lines", r.total_lines, "#3b82f6"], ["Avg Score", `${r.avg_quality_score}/10`, sc(r.avg_quality_score)]].map(([l, v, c]) => (
          <div key={l} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "0.875rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: c }}>{v}</div>
            <div style={{ fontSize: "0.62rem", color: "#6b7280", marginTop: "2px" }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Language breakdown */}
      {r.lang_breakdown && Object.keys(r.lang_breakdown).length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "0.875rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.62rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>Languages Detected</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {Object.entries(r.lang_breakdown).map(([lang, count]) => (
              <div key={lang} style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "3px 10px", borderRadius: 6, background: `${langColors[lang] || "#6b7280"}18`, border: `1px solid ${langColors[lang] || "#6b7280"}33` }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: langColors[lang] || "#6b7280" }} />
                <span style={{ fontSize: "0.72rem", color: "#9ca3af", textTransform: "capitalize" }}>{lang}</span>
                <span style={{ fontSize: "0.68rem", color: "#6b7280" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {r.riskiest_files?.length > 0 && (
        <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 12, padding: "1rem", marginBottom: "1.25rem" }}>
          <div style={{ fontSize: "0.65rem", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>⚠ Riskiest Files</div>
          {r.riskiest_files.map((f, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
              <span style={{ fontSize: "0.72rem", color: "#ef4444", fontWeight: 700, minWidth: 16 }}>{i + 1}.</span>
              <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#fca5a5" }}>{f}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>Per-File Quality Scores</div>
      {r.file_scores?.map((fs, i) => (
        <div key={i} style={{ padding: "0.5rem 0.875rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, marginBottom: "0.3rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.875rem" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#93c5fd", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fs.file}</span>
            <span style={{ fontSize: "0.6rem", padding: "1px 6px", borderRadius: 4, background: `${langColors[fs.lang] || "#6b7280"}18`, color: langColors[fs.lang] || "#6b7280" }}>{fs.lang}</span>
            <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>B:<span style={{ color: "#ef4444" }}>{fs.bugs}</span></span>
            <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>S:<span style={{ color: "#f59e0b" }}>{fs.security}</span></span>
            <span style={{ fontWeight: 700, fontSize: "0.8rem", color: sc(fs.score) }}>{fs.score}/10</span>
            <span style={{ fontSize: "0.68rem", color: "#6b7280", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4 }}>{fs.grade}</span>
          </div>
          {fs.issues?.length > 0 && (
            <div style={{ marginTop: "0.3rem", display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
              {fs.issues.map((issue, j) => (
                <span key={j} style={{ fontSize: "0.62rem", color: "#6b7280", background: "rgba(255,255,255,0.03)", padding: "1px 6px", borderRadius: 4 }}>{issue}</span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function TaintSection({ r }) {
  const paths = r.cross_file_taint || [];
  const summary = r.taint_summary || {};
  const RISK_COLORS = { "SQL Injection": "#ef4444", "Command Injection": "#f97316", "Code Injection": "#a855f7", "Path Traversal": "#f59e0b", "Insecure Deserialization": "#6366f1", "Server-Side Template Injection": "#ec4899" };
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.6rem", marginBottom: "1.25rem" }}>
        {[["Taint Sources", summary.total_sources, "#ef4444"], ["Total Paths", summary.total_paths, "#f97316"], ["Cross-File", summary.cross_file_paths, "#a855f7"]].map(([l, v, c]) => (
          <div key={l} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "0.875rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.4rem", fontWeight: 800, color: c }}>{v ?? 0}</div>
            <div style={{ fontSize: "0.62rem", color: "#6b7280", marginTop: "2px" }}>{l}</div>
          </div>
        ))}
      </div>
      {!paths.length && <p style={{ color: "#10b981", fontSize: "0.85rem" }}>✓ No taint paths detected across files</p>}
      {paths.map((p, i) => {
        const c = RISK_COLORS[p.risk] || "#6b7280";
        return (
          <div key={i} style={{ background: `${c}0d`, border: `1px solid ${c}33`, borderRadius: 14, padding: "1rem", marginBottom: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: `${c}22`, color: c, border: `1px solid ${c}44` }}>⚠ {p.risk}</span>
                {p.hops > 0 && <span style={{ fontSize: "0.65rem", padding: "2px 7px", borderRadius: 5, background: "rgba(168,85,247,0.15)", color: "#d8b4fe", border: "1px solid rgba(168,85,247,0.3)" }}>🔀 {p.hops} file hop{p.hops !== 1 ? "s" : ""}</span>}
              </div>
              <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>{p.severity}</span>
            </div>
            {/* Flow */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
              <div style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 7, padding: "0.3rem 0.6rem" }}>
                <div style={{ fontSize: "0.55rem", color: "#6b7280" }}>SOURCE · {p.source_file}</div>
                <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "#fca5a5", fontWeight: 600 }}>{p.source_type} → `{p.source_variable}`</div>
              </div>
              <span style={{ color: "#374151", fontSize: "1rem" }}>→</span>
              <div style={{ background: `${c}12`, border: `1px solid ${c}33`, borderRadius: 7, padding: "0.3rem 0.6rem" }}>
                <div style={{ fontSize: "0.55rem", color: "#6b7280" }}>SINK · {p.sink_file}</div>
                <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: c, fontWeight: 600 }}>{p.sink_call}</div>
              </div>
            </div>
            {/* Path trace */}
            {p.path?.length > 0 && (
              <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 8, padding: "0.6rem 0.875rem" }}>
                <div style={{ fontSize: "0.6rem", color: "#6b7280", marginBottom: "0.3rem" }}>CALL PATH</div>
                {p.path.map((step, j) => (
                  <div key={j} style={{ fontSize: "0.68rem", color: "#9ca3af", fontFamily: "monospace", marginBottom: "2px" }}>
                    {j > 0 && <span style={{ color: "#374151", marginRight: "0.4rem" }}>↳</span>}{step}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function ComplexitySection({ r }) {
  const items = r.complexity_hotspots || [];
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>Functions ranked by cyclomatic complexity (worst first)</div>
      {!items.length && <p style={{ color: "#10b981", fontSize: "0.82rem" }}>No complexity hotspots detected.</p>}
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.6rem 0.875rem", background: "rgba(255,255,255,0.02)", border: `1px solid ${RISK_COLOR[item.risk] || "#374151"}22`, borderRadius: 9, marginBottom: "0.4rem" }}>
          <span style={{ fontSize: "0.72rem", color: "#4b5563", minWidth: 20 }}>#{i + 1}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#93c5fd" }}>{item.function}()</div>
            <div style={{ fontSize: "0.65rem", color: "#6b7280", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.file}:{item.line}</div>
          </div>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
            <span style={{ fontSize: "0.68rem", color: "#6b7280" }}>{item.loc} lines</span>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: 800, color: RISK_COLOR[item.risk] || "#6b7280" }}>{item.complexity}</div>
              <div style={{ fontSize: "0.55rem", color: "#6b7280" }}>complexity</div>
            </div>
            <span style={{ fontSize: "0.65rem", padding: "2px 7px", borderRadius: 5, background: `${RISK_COLOR[item.risk] || "#6b7280"}18`, color: RISK_COLOR[item.risk] || "#6b7280", border: `1px solid ${RISK_COLOR[item.risk] || "#6b7280"}33` }}>{item.risk}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function DuplicatesSection({ r }) {
  const clusters = r.duplicate_clusters || [];
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>Cross-file duplicate function clusters (Jaccard similarity)</div>
      {!clusters.length && <p style={{ color: "#10b981", fontSize: "0.82rem" }}>No duplicate clusters detected.</p>}
      {clusters.map((c, i) => (
        <div key={i} style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 12, padding: "1rem", marginBottom: "0.875rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#fcd34d" }}>⧉ {c.functions.length} duplicate functions</span>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {c.cross_file && <span style={{ fontSize: "0.65rem", padding: "2px 7px", borderRadius: 5, background: "rgba(168,85,247,0.15)", color: "#d8b4fe" }}>cross-file</span>}
              <span style={{ fontSize: "0.65rem", padding: "2px 7px", borderRadius: 5, background: "rgba(245,158,11,0.15)", color: "#fcd34d" }}>{Math.round(c.similarity * 100)}% similar</span>
            </div>
          </div>
          {c.functions.map((f, j) => (
            <div key={j} style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.72rem", color: "#93c5fd" }}>{f.function}()</span>
              <span style={{ fontSize: "0.68rem", color: "#6b7280" }}>in {f.file}:{f.line}</span>
            </div>
          ))}
          <pre style={{ background: "rgba(0,0,0,0.2)", borderRadius: 7, padding: "0.6rem", fontSize: "0.68rem", color: "#9ca3af", margin: "0.6rem 0 0", overflowX: "auto", maxHeight: 100 }}>{c.snippet}</pre>
        </div>
      ))}
    </div>
  );
}

function CouplingSection({ r }) {
  const items = r.coupling_map || [];
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>Files ranked by coupling score — high coupling = risky to change</div>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.6rem 0.875rem", background: "rgba(255,255,255,0.02)", border: `1px solid ${RISK_COLOR[item.risk] || "#374151"}22`, borderRadius: 9, marginBottom: "0.4rem" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#93c5fd", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.file}</div>
          </div>
          <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>imported by <span style={{ color: "#a5b4fc", fontWeight: 700 }}>{item.imported_by}</span></span>
          <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>imports <span style={{ color: "#a5b4fc" }}>{item.imports_count}</span></span>
          <div style={{ width: 60, height: 6, background: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${item.coupling_score * 100}%`, background: RISK_COLOR[item.risk] || "#6b7280", borderRadius: 3 }} />
          </div>
          <span style={{ fontSize: "0.65rem", padding: "2px 7px", borderRadius: 5, background: `${RISK_COLOR[item.risk] || "#6b7280"}18`, color: RISK_COLOR[item.risk] || "#6b7280" }}>{item.risk}</span>
        </div>
      ))}
    </div>
  );
}

function DeadCodeSection({ r }) {
  const items = r.dead_functions || [];
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>Functions defined but never called anywhere in the repository</div>
      {!items.length && <p style={{ color: "#10b981", fontSize: "0.82rem" }}>No dead code detected.</p>}
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.55rem 0.875rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, marginBottom: "0.3rem" }}>
          <span style={{ fontSize: "0.75rem" }}>💀</span>
          <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#9ca3af" }}>{item.function}()</span>
          <span style={{ fontSize: "0.68rem", color: "#6b7280", flex: 1 }}>{item.file}:{item.line}</span>
          <span style={{ fontSize: "0.65rem", color: "#4b5563" }}>never called</span>
        </div>
      ))}
    </div>
  );
}

function ArchSection({ r }) {
  const layers = r.architecture_layers || [];
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>Architecture layers detected from file naming patterns</div>
      {layers.map((layer, i) => {
        const c = LAYER_COLOR[layer.layer] || "#6b7280";
        return (
          <div key={i} style={{ background: `${c}0d`, border: `1px solid ${c}22`, borderRadius: 12, padding: "0.875rem", marginBottom: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: c, textTransform: "capitalize" }}>{layer.layer}</span>
              <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>{layer.count} file{layer.count !== 1 ? "s" : ""}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
              {layer.files.map((f, j) => (
                <span key={j} style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#9ca3af", background: "rgba(255,255,255,0.04)", padding: "2px 7px", borderRadius: 5 }}>{f.split("/").pop()}</span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RecurringSection({ r }) {
  const insights = r.insights || [];
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>
        Recurring issues across {r.analyses_count} analyses — the system remembers your codebase
      </div>
      {!insights.length && (
        <div style={{ padding: "1.25rem", background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 12 }}>
          <p style={{ color: "#6ee7b7", fontSize: "0.85rem", margin: 0 }}>✓ No recurring patterns detected yet.</p>
          <p style={{ color: "#6b7280", fontSize: "0.72rem", margin: "0.4rem 0 0" }}>{r.message || "Analyze this repo again after making changes to see trends."}</p>
        </div>
      )}
      {insights.map((ins, i) => {
        const c = RISK_COLOR[ins.severity] || "#6b7280";
        return (
          <div key={i} style={{ background: `${c}0d`, border: `1px solid ${c}22`, borderRadius: 12, padding: "1rem", marginBottom: "0.875rem" }}>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "2px 8px", borderRadius: 5, background: `${c}22`, color: c, border: `1px solid ${c}44`, textTransform: "uppercase" }}>{ins.severity}</span>
              <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>{ins.type.replace(/_/g, " ")}</span>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#d1d5db", margin: "0 0 0.5rem", lineHeight: 1.5 }}>{ins.message}</p>
            <p style={{ fontSize: "0.75rem", color: "#6366f1", margin: 0 }}>→ {ins.recommendation}</p>
            {ins.data?.length > 0 && (
              <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: 32, marginTop: "0.75rem" }}>
                {ins.data.map((v, j) => {
                  const max = Math.max(...ins.data, 1);
                  return <div key={j} style={{ flex: 1, height: `${(v / max) * 100}%`, background: c, borderRadius: "2px 2px 0 0", minHeight: 3, opacity: 0.7 }} title={String(v)} />;
                })}
              </div>
            )}
          </div>
        );
      })}
      {r.score_trend?.length > 0 && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "1rem", marginTop: "0.5rem" }}>
          <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>Quality Score Trend</div>
          <div style={{ display: "flex", alignItems: "flex-end", gap: "4px", height: 48 }}>
            {r.score_trend.map((v, i) => (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                <div style={{ fontSize: "0.48rem", color: "#4b5563" }}>{v?.toFixed(1)}</div>
                <div style={{ width: "100%", height: `${(v / 10) * 100}%`, background: sc(v), borderRadius: "2px 2px 0 0", minHeight: 3 }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const SEV_COLOR = { critical:"#ef4444", high:"#f97316", medium:"#f59e0b", low:"#6b7280", info:"#6366f1" };
const CAT_ICON  = { security:"🔒", bug:"🐛", style:"✏️", performance:"⚡", maintainability:"🔧", reliability:"🛡️", architecture:"🏗️" };

function IssuesSection({ r }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const issues = r.detailed_issues || [];

  const filtered = issues.filter(i => {
    if (filter !== "all" && i.severity !== filter) return false;
    if (search && !i.file.toLowerCase().includes(search.toLowerCase()) &&
        !i.message.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const counts = { critical: 0, high: 0, medium: 0, low: 0 };
  issues.forEach(i => { if (counts[i.severity] !== undefined) counts[i.severity]++; });

  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        {[["all", "All", issues.length, "#6366f1"], ["critical", "Critical", counts.critical, "#ef4444"], ["high", "High", counts.high, "#f97316"], ["medium", "Medium", counts.medium, "#f59e0b"], ["low", "Low", counts.low, "#6b7280"]].map(([val, label, count, color]) => (
          <button key={val} onClick={() => setFilter(val)} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${filter === val ? color : "rgba(255,255,255,0.08)"}`, background: filter === val ? `${color}18` : "rgba(255,255,255,0.03)", color: filter === val ? color : "#6b7280", fontSize: "0.75rem", cursor: "pointer", fontWeight: filter === val ? 700 : 400 }}>
            {label} <span style={{ opacity: 0.7 }}>{count}</span>
          </button>
        ))}
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search file or message..."
          style={{ marginLeft: "auto", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 10px", color: "#e5e7eb", fontSize: "0.75rem", outline: "none", width: 200 }} />
      </div>

      {!filtered.length && <p style={{ color: "#4b5563", fontSize: "0.82rem" }}>No issues match the filter.</p>}

      {filtered.map((issue, i) => (
        <div key={i} style={{ background: `${SEV_COLOR[issue.severity] || "#6b7280"}08`, border: `1px solid ${SEV_COLOR[issue.severity] || "#6b7280"}22`, borderRadius: 12, padding: "0.875rem", marginBottom: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
            <span style={{ fontSize: "1rem", flexShrink: 0, marginTop: 1 }}>{CAT_ICON[issue.category] || "⚠"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.4rem" }}>
                <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#93c5fd" }}>{issue.file}</span>
                <span style={{ fontSize: "0.68rem", color: "#6b7280" }}>line {issue.line}{issue.col > 0 ? `:${issue.col}` : ""}</span>
                <span style={{ fontSize: "0.62rem", padding: "1px 7px", borderRadius: 4, background: `${SEV_COLOR[issue.severity]}22`, color: SEV_COLOR[issue.severity], border: `1px solid ${SEV_COLOR[issue.severity]}44`, fontWeight: 700 }}>{issue.severity}</span>
                <span style={{ fontSize: "0.62rem", padding: "1px 7px", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: "#6b7280" }}>{issue.code}</span>
                <span style={{ fontSize: "0.62rem", color: "#4b5563" }}>{issue.tool}</span>
              </div>
              {/* What */}
              <p style={{ margin: "0 0 0.4rem", fontSize: "0.82rem", color: "#e5e7eb", fontWeight: 500 }}>{issue.message}</p>
              {/* How to fix */}
              <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: 8, padding: "0.5rem 0.75rem" }}>
                <span style={{ fontSize: "0.62rem", color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>How to fix → </span>
                <span style={{ fontSize: "0.75rem", color: "#c7d2fe" }}>{issue.fix_hint}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const EFFORT_COLOR  = { low: "#10b981", medium: "#f59e0b", high: "#ef4444" };
const IMPACT_COLOR  = { low: "#6b7280", medium: "#3b82f6", high: "#f97316", critical: "#ef4444" };
const CAT_COLOR     = { security:"#ef4444", reliability:"#f97316", performance:"#f59e0b", maintainability:"#6366f1", architecture:"#8b5cf6" };

function ImprovementsSection({ r }) {
  const [expanded, setExpanded] = useState({});
  const improvements = r.improvements || [];

  if (!improvements.length) {
    return <p style={{ color: "#10b981", fontSize: "0.85rem" }}>✓ No major improvements needed. Great codebase!</p>;
  }

  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>
        {improvements.length} prioritized improvement{improvements.length !== 1 ? "s" : ""} — ordered by impact
      </div>
      {improvements.map((imp, i) => {
        const catColor = CAT_COLOR[imp.category] || "#6b7280";
        const open = expanded[i];
        return (
          <div key={i} style={{ background: `${catColor}08`, border: `1px solid ${catColor}22`, borderRadius: 14, marginBottom: "0.875rem", overflow: "hidden" }}>
            <button onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))} style={{ width: "100%", display: "flex", alignItems: "flex-start", gap: "0.875rem", padding: "1rem", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}>
              {/* Priority badge */}
              <div style={{ width: 28, height: 28, borderRadius: 8, background: `${catColor}22`, border: `1px solid ${catColor}44`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, color: catColor, flexShrink: 0 }}>
                {imp.priority}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.3rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#e5e7eb" }}>{imp.title}</span>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "0.62rem", padding: "1px 7px", borderRadius: 4, background: `${catColor}18`, color: catColor, border: `1px solid ${catColor}33`, textTransform: "capitalize" }}>{imp.category}</span>
                  <span style={{ fontSize: "0.62rem", padding: "1px 7px", borderRadius: 4, background: `${IMPACT_COLOR[imp.impact] || "#6b7280"}18`, color: IMPACT_COLOR[imp.impact] || "#6b7280" }}>impact: {imp.impact}</span>
                  <span style={{ fontSize: "0.62rem", padding: "1px 7px", borderRadius: 4, background: `${EFFORT_COLOR[imp.effort] || "#6b7280"}18`, color: EFFORT_COLOR[imp.effort] || "#6b7280" }}>effort: {imp.effort}</span>
                  {imp.affected_files?.length > 0 && <span style={{ fontSize: "0.62rem", color: "#4b5563" }}>{imp.affected_files.length} file{imp.affected_files.length !== 1 ? "s" : ""} affected</span>}
                </div>
              </div>
              <span style={{ color: "#4b5563", fontSize: "0.75rem", flexShrink: 0 }}>{open ? "▲" : "▼"}</span>
            </button>

            {open && (
              <div style={{ padding: "0 1rem 1rem", borderTop: `1px solid ${catColor}18` }}>
                {/* What */}
                <div style={{ marginBottom: "0.875rem" }}>
                  <div style={{ fontSize: "0.62rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>What's the problem</div>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#d1d5db", lineHeight: 1.6, whiteSpace: "pre-line" }}>{imp.description}</p>
                </div>

                {/* Why */}
                <div style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)", borderRadius: 8, padding: "0.6rem 0.875rem", marginBottom: "0.875rem" }}>
                  <div style={{ fontSize: "0.62rem", color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>Why it matters</div>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#fca5a5", lineHeight: 1.5 }}>{imp.why_it_matters}</p>
                </div>

                {/* How to fix */}
                <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 8, padding: "0.6rem 0.875rem", marginBottom: imp.affected_lines?.length ? "0.875rem" : 0 }}>
                  <div style={{ fontSize: "0.62rem", color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>How to fix</div>
                  <p style={{ margin: 0, fontSize: "0.78rem", color: "#c7d2fe", lineHeight: 1.6, whiteSpace: "pre-line" }}>{imp.how_to_fix}</p>
                </div>

                {/* Affected locations */}
                {imp.affected_lines?.length > 0 && (
                  <div style={{ marginTop: "0.875rem" }}>
                    <div style={{ fontSize: "0.62rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>Affected locations</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                      {imp.affected_lines.map((loc, j) => (
                        <span key={j} style={{ fontFamily: "monospace", fontSize: "0.68rem", color: "#93c5fd", background: "rgba(147,197,253,0.08)", padding: "2px 8px", borderRadius: 5 }}>{loc}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
