import React, { useState, useRef } from "react";
import { runPipeline } from "../api";

const EXAMPLE_FILES = {
  "auth.py": `import os\n\ndef login(username, password):\n    query = "SELECT * FROM users WHERE name = '" + username + "'"\n    secret = "hardcoded_key_123"\n    result = eval(username)\n    return result\n\ndef process(items):\n    for i in range(len(items)):\n        for j in range(len(items)):\n            print(items[i], items[j])\n`,
  "utils.py": `def fetch_users(db, ids):\n    results = []\n    for id in ids:\n        user = db.execute("SELECT * FROM users WHERE id=" + str(id))\n        results.append(user)\n    return results\n`,
};

const AGENTS = [
  { id: 1, name: "Static Analyzer", icon: "🔬", desc: "pylint + bandit + flake8, scores 0-10", color: "#3b82f6" },
  { id: 2, name: "Patch Generator", icon: "🔧", desc: "AI generates complete fixed code",       color: "#8b5cf6" },
  { id: 3, name: "Verifier",        icon: "✅", desc: "Re-runs analysis, confirms improvement", color: "#10b981" },
  { id: 4, name: "Report Writer",   icon: "📄", desc: "Executive summary with before/after",    color: "#f59e0b" },
];

const scoreColor = (s) => s >= 8 ? "#10b981" : s >= 6 ? "#3b82f6" : s >= 4 ? "#f59e0b" : "#ef4444";
const deltaColor = (d) => d > 0 ? "#10b981" : d < 0 ? "#ef4444" : "#6b7280";
const confColor  = { high: "#10b981", medium: "#f59e0b", low: "#ef4444" };

export default function PipelinePage() {
  const [files, setFiles]         = useState(EXAMPLE_FILES);
  const [activeFile, setActiveFile] = useState("auth.py");
  const [newName, setNewName]     = useState("");
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [activeAgent, setActiveAgent] = useState(0);
  const [error, setError]         = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const resultRef = useRef(null);

  const addFile = () => {
    const name = newName.trim() || `file${Object.keys(files).length + 1}.py`;
    setFiles(f => ({ ...f, [name]: "" }));
    setActiveFile(name);
    setNewName("");
  };

  const removeFile = (name) => {
    const next = { ...files };
    delete next[name];
    setFiles(next);
    if (activeFile === name) setActiveFile(Object.keys(next)[0] || "");
  };

  const handleRun = async () => {
    setLoading(true); setError(null); setResult(null); setActiveAgent(1);
    const t2 = setTimeout(() => setActiveAgent(2), 4000);
    const t3 = setTimeout(() => setActiveAgent(3), 9000);
    const t4 = setTimeout(() => setActiveAgent(4), 13000);
    try {
      const res = await runPipeline(files, 5, "all");
      setResult(res.data);
      setActiveTab("overview");
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    }
    clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
    setActiveAgent(0); setLoading(false);
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.5rem" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>⚡</div>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Autonomous Pipeline</h1>
          <p style={{ margin: "3px 0 0", color: "#6b7280", fontSize: "0.82rem" }}>4 specialized agents: analyze → patch → verify → report</p>
        </div>
      </div>

      {/* Agent flow */}
      <div style={{ display: "flex", alignItems: "center", gap: 0, marginBottom: "1.75rem", overflowX: "auto", paddingBottom: "0.5rem" }}>
        {AGENTS.map((agent, i) => (
          <React.Fragment key={agent.id}>
            <div style={{ flex: "0 0 auto", padding: "0.7rem 1rem", borderRadius: 12, background: activeAgent === agent.id ? `${agent.color}22` : "rgba(255,255,255,0.03)", border: `1px solid ${activeAgent === agent.id ? agent.color + "66" : "rgba(255,255,255,0.07)"}`, transition: "all 0.3s", boxShadow: activeAgent === agent.id ? `0 0 16px ${agent.color}33` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                <span style={{ fontSize: "1rem" }}>{agent.icon}</span>
                <span style={{ fontSize: "0.75rem", fontWeight: 700, color: activeAgent === agent.id ? agent.color : "#9ca3af" }}>Agent {agent.id}: {agent.name}</span>
                {loading && activeAgent === agent.id && <div style={{ width: 7, height: 7, borderRadius: "50%", background: agent.color, animation: "pulse 1s infinite" }} />}
              </div>
              <div style={{ fontSize: "0.65rem", color: "#4b5563", maxWidth: 170 }}>{agent.desc}</div>
            </div>
            {i < AGENTS.length - 1 && <div style={{ flex: "0 0 auto", padding: "0 0.4rem", color: "#374151", fontSize: "1.1rem" }}>→</div>}
          </React.Fragment>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: "1.5rem" }}>
        {/* Left: file editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Project Files</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" }}>
              {Object.keys(files).map(name => (
                <div key={name} style={{ display: "flex", alignItems: "center" }}>
                  <button onClick={() => setActiveFile(name)} style={{ padding: "3px 9px", borderRadius: "6px 0 0 6px", border: `1px solid ${activeFile === name ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.08)"}`, background: activeFile === name ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.04)", color: activeFile === name ? "#a5b4fc" : "#9ca3af", fontSize: "0.72rem", cursor: "pointer", fontFamily: "monospace" }}>{name}</button>
                  <button onClick={() => removeFile(name)} style={{ padding: "3px 6px", borderRadius: "0 6px 6px 0", border: "1px solid rgba(255,255,255,0.08)", borderLeft: "none", background: "rgba(255,255,255,0.04)", color: "#4b5563", fontSize: "0.65rem", cursor: "pointer" }}>×</button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addFile()} placeholder="new_file.py" style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, padding: "5px 9px", color: "#e5e7eb", fontSize: "0.72rem", outline: "none", fontFamily: "monospace" }} />
              <button onClick={addFile} style={{ padding: "5px 11px", background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 7, color: "#a5b4fc", fontSize: "0.72rem", cursor: "pointer" }}>+ Add</button>
            </div>
          </div>

          {activeFile && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "6px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.68rem", color: "#6b7280", fontFamily: "monospace" }}>{activeFile}</div>
              <textarea value={files[activeFile] || ""} onChange={e => setFiles(f => ({ ...f, [activeFile]: e.target.value }))} style={{ width: "100%", minHeight: 240, background: "#0d1117", border: "none", padding: "0.875rem", color: "#c9d1d9", fontSize: "0.75rem", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }} />
            </div>
          )}

          <button onClick={handleRun} disabled={loading || Object.keys(files).length === 0} style={{ padding: "13px", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer", background: loading ? "rgba(99,102,241,0.2)" : "linear-gradient(135deg,#2563eb,#7c3aed)", color: loading ? "#6b7280" : "white", transition: "all 0.2s" }}>
            {loading ? "⚡ Pipeline running..." : "⚡ Run Autonomous Pipeline →"}
          </button>

          {error && <div style={{ padding: "0.875rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 10, color: "#fca5a5", fontSize: "0.78rem" }}>{error}</div>}
        </div>

        {/* Right: results */}
        <div ref={resultRef} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", minHeight: 500 }}>
          {!result && !loading && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", color: "#374151", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.15 }}>⚡</div>
              <p style={{ fontSize: "0.85rem", color: "#4b5563" }}>Add your files and run the pipeline</p>
              <p style={{ fontSize: "0.72rem", color: "#374151", marginTop: "0.4rem" }}>4 agents will analyze, patch, verify, and report</p>
            </div>
          )}
          {loading && <PipelineLoader activeAgent={activeAgent} />}
          {result && <ResultPanel result={result} activeTab={activeTab} setActiveTab={setActiveTab} />}
        </div>
      </div>
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}} @keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function PipelineLoader({ activeAgent }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem 2rem" }}>
      <div style={{ width: 40, height: 40, border: "3px solid rgba(99,102,241,0.2)", borderTop: "3px solid #6366f1", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "2rem" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", width: "100%", maxWidth: 340 }}>
        {AGENTS.map(agent => (
          <div key={agent.id} style={{ display: "flex", alignItems: "center", gap: "0.875rem", opacity: activeAgent >= agent.id ? 1 : 0.2, transition: "opacity 0.5s" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: activeAgent >= agent.id ? `${agent.color}22` : "rgba(255,255,255,0.03)", border: `1px solid ${activeAgent >= agent.id ? agent.color + "44" : "rgba(255,255,255,0.07)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", flexShrink: 0 }}>
              {activeAgent > agent.id ? "✓" : agent.icon}
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: activeAgent >= agent.id ? "#e5e7eb" : "#374151" }}>Agent {agent.id}: {agent.name}</div>
              <div style={{ fontSize: "0.65rem", color: "#4b5563" }}>{agent.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResultPanel({ result, activeTab, setActiveTab }) {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 1rem" }}>
        {["overview", "patches", "verify", "report"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding: "0.75rem 1rem", background: "none", border: "none", borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent", color: activeTab === tab ? "#a5b4fc" : "#6b7280", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{tab}</button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", padding: "0 0.5rem" }}>
          <span style={{ fontSize: "0.65rem", color: "#4b5563" }}>{result.duration_sec}s</span>
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
        {activeTab === "overview" && <OverviewTab result={result} />}
        {activeTab === "patches"  && <PatchesTab  result={result} />}
        {activeTab === "verify"   && <VerifyTab   result={result} />}
        {activeTab === "report"   && <ReportTab   result={result} />}
      </div>
    </div>
  );
}

function OverviewTab({ result }) {
  const improved = result.verifications?.filter(v => v.improved).length || 0;
  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.75rem", marginBottom: "1.25rem" }}>
        {[["Files Analyzed", result.files_analyzed, "#3b82f6"], ["Patches", result.patches_generated, "#8b5cf6"], ["Improved", `${improved}/${result.patches_generated}`, "#10b981"], ["Delta", `${result.avg_delta >= 0 ? "+" : ""}${result.avg_delta?.toFixed(1)}`, deltaColor(result.avg_delta)]].map(([l, v, c]) => (
          <div key={l} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "0.875rem", textAlign: "center" }}>
            <div style={{ fontSize: "1.5rem", fontWeight: 800, color: c }}>{v}</div>
            <div style={{ fontSize: "0.62rem", color: "#6b7280", marginTop: "2px" }}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1rem", marginBottom: "1.25rem" }}>
        <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>Average Quality Score</div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {[["Before", result.avg_before], ["After", result.avg_after]].map(([label, val], i) => (
            <React.Fragment key={label}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.62rem", color: "#6b7280", marginBottom: "4px" }}>{label}</div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(val / 10) * 100}%`, background: scoreColor(val), borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: scoreColor(val), marginTop: "4px" }}>{val?.toFixed(1)}/10</div>
              </div>
              {i === 0 && <div style={{ fontSize: "1rem", color: "#374151" }}>→</div>}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>File Scores</div>
      {result.file_scores?.map((fs, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.55rem 0.875rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 8, marginBottom: "0.35rem" }}>
          <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#93c5fd", flex: 1 }}>{fs.filename}</span>
          <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>Bugs: <span style={{ color: "#ef4444" }}>{fs.bugs}</span></span>
          <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>Sec: <span style={{ color: "#f59e0b" }}>{fs.security_issues}</span></span>
          <span style={{ fontWeight: 700, fontSize: "0.82rem", color: scoreColor(fs.score) }}>{fs.score?.toFixed(1)}/10</span>
          <span style={{ fontSize: "0.68rem", color: "#6b7280", background: "rgba(255,255,255,0.05)", padding: "1px 6px", borderRadius: 4 }}>{fs.grade}</span>
        </div>
      ))}
    </div>
  );
}

function PatchesTab({ result }) {
  const [expanded, setExpanded] = useState({});
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>AI-Generated Patches (Agent 2)</div>
      {!result.patches?.length && <p style={{ color: "#4b5563", fontSize: "0.82rem" }}>No patches generated.</p>}
      {result.patches?.map((p, i) => (
        <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, marginBottom: "0.875rem", overflow: "hidden" }}>
          <button onClick={() => setExpanded(e => ({ ...e, [i]: !e[i] }))} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.875rem 1rem", background: "none", border: "none", cursor: "pointer", color: "white" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <span style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#93c5fd" }}>{p.filename}</span>
              <span style={{ fontSize: "0.65rem", padding: "2px 7px", borderRadius: 4, background: `${confColor[p.confidence] || "#6b7280"}22`, color: confColor[p.confidence] || "#6b7280", border: `1px solid ${confColor[p.confidence] || "#6b7280"}44` }}>{p.confidence} confidence</span>
            </div>
            <span style={{ color: "#6b7280", fontSize: "0.7rem" }}>{expanded[i] ? "▲" : "▼"}</span>
          </button>
          {expanded[i] && (
            <div style={{ padding: "0 1rem 1rem" }}>
              <p style={{ fontSize: "0.78rem", color: "#9ca3af", marginBottom: "0.75rem", lineHeight: 1.6 }}>{p.explanation}</p>
              <div style={{ fontSize: "0.65rem", color: "#6b7280", marginBottom: "0.4rem" }}>Fixed Code:</div>
              <pre style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "0.875rem", fontSize: "0.72rem", color: "#c9d1d9", overflowX: "auto", maxHeight: 300, margin: 0, fontFamily: "monospace", lineHeight: 1.6 }}>{p.patch}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function VerifyTab({ result }) {
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>Verification Results (Agent 3)</div>
      {!result.verifications?.length && <p style={{ color: "#4b5563", fontSize: "0.82rem" }}>No verifications run.</p>}
      {result.verifications?.map((v, i) => (
        <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${v.improved ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.15)"}`, borderRadius: 12, padding: "1rem", marginBottom: "0.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
            <span style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "#93c5fd" }}>{v.filename}</span>
            <span style={{ fontSize: "0.78rem", fontWeight: 700, color: v.improved ? "#10b981" : "#ef4444" }}>{v.improved ? "✓ Improved" : "✗ No improvement"}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: scoreColor(v.before_score) }}>{v.before_score?.toFixed(1)}</div>
              <div style={{ fontSize: "0.6rem", color: "#6b7280" }}>Before</div>
            </div>
            <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(v.before_score / 10) * 100}%`, background: scoreColor(v.before_score), borderRadius: 2 }} />
            </div>
            <div style={{ fontSize: "1rem", color: deltaColor(v.delta), fontWeight: 700 }}>{v.delta >= 0 ? "+" : ""}{v.delta?.toFixed(1)}</div>
            <div style={{ flex: 1, height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2, position: "relative" }}>
              <div style={{ position: "absolute", left: 0, top: 0, height: "100%", width: `${(v.after_score / 10) * 100}%`, background: scoreColor(v.after_score), borderRadius: 2 }} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: scoreColor(v.after_score) }}>{v.after_score?.toFixed(1)}</div>
              <div style={{ fontSize: "0.6rem", color: "#6b7280" }}>After</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportTab({ result }) {
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>Executive Summary (Agent 4)</div>
      <div style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12, padding: "1.25rem", marginBottom: "1.25rem" }}>
        <p style={{ fontSize: "0.85rem", color: "#d1d5db", lineHeight: 1.7, margin: 0 }}>{result.executive_summary}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
        {[["Files Analyzed", result.files_analyzed], ["Patches Generated", result.patches_generated], ["Files Improved", result.files_improved], ["Score Before", `${result.avg_before?.toFixed(1)}/10`], ["Score After", `${result.avg_after?.toFixed(1)}/10`], ["Total Delta", `${result.avg_delta >= 0 ? "+" : ""}${result.avg_delta?.toFixed(1)}`], ["Duration", `${result.duration_sec}s`]].map(([label, val]) => (
          <div key={label} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 8, padding: "0.7rem" }}>
            <div style={{ fontSize: "0.62rem", color: "#6b7280", marginBottom: "2px" }}>{label}</div>
            <div style={{ fontSize: "1rem", fontWeight: 700, color: "#e5e7eb" }}>{val}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
