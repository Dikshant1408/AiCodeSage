import React, { useState } from "react";
import { securityScan, controlFlow } from "../api";
import NextSteps from "../components/NextSteps";
import { saveLastAnalysis } from "../lib/lastAnalysis";

const EXAMPLE = `import os
from flask import request

def get_user(db):
    user_id = request.args.get('id')
    query = "SELECT * FROM users WHERE id = " + user_id
    result = db.execute(query)
    return result

def run_command(cmd_input):
    user_cmd = request.form.get('cmd')
    os.system(user_cmd)

def load_data(filename):
    path = request.args.get('file')
    data = open(path).read()
    return eval(data)
`;

const RISK_COLORS = {
  "SQL Injection":           { bg: "#450a0a", border: "#7f1d1d", text: "#fca5a5", badge: "#ef4444" },
  "Command Injection":       { bg: "#431407", border: "#7c2d12", text: "#fdba74", badge: "#f97316" },
  "Code Injection":          { bg: "#3b0764", border: "#6b21a8", text: "#d8b4fe", badge: "#a855f7" },
  "Path Traversal":          { bg: "#422006", border: "#78350f", text: "#fcd34d", badge: "#f59e0b" },
  "Insecure Deserialization":{ bg: "#1e1b4b", border: "#3730a3", text: "#a5b4fc", badge: "#6366f1" },
};

const DEFAULT_RISK = { bg: "#0f172a", border: "#1e293b", text: "#94a3b8", badge: "#64748b" };

export default function SecurityPage() {
  const [code, setCode]       = useState(EXAMPLE);
  const [result, setResult]   = useState(null);
  const [taint, setTaint]     = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  const [tab, setTab]         = useState("taint");

  const handleScan = async () => {
    setLoading(true); setError(null); setResult(null); setTaint(null);
    try {
      const [secRes, cfRes] = await Promise.all([
        securityScan(code),
        controlFlow(code),
      ]);
      setResult(secRes.data);
      setTaint(cfRes.data);
      saveLastAnalysis({ tool: "security", taint_paths: cfRes.data?.data_flow_issues?.length || 0 });
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    }
    setLoading(false);
  };

  const dataFlowIssues = taint?.data_flow_issues || [];
  const hasFindings = dataFlowIssues.length > 0;

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.75rem" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.6rem" }}>⬢</div>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 800, background: "linear-gradient(135deg,#f87171,#fb923c)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Security Analysis</h1>
          <p style={{ margin: "3px 0 0", color: "#6b7280", fontSize: "0.82rem" }}>AST taint tracking + bandit static analysis — traces user input to dangerous sinks</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "400px 1fr", gap: "1.5rem" }}>
        {/* Left: editor */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, overflow: "hidden" }}>
            <div style={{ padding: "6px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.68rem", color: "#6b7280", fontFamily: "monospace" }}>code.py</div>
            <textarea value={code} onChange={e => setCode(e.target.value)} style={{ width: "100%", minHeight: 340, background: "#0d1117", border: "none", padding: "0.875rem", color: "#c9d1d9", fontSize: "0.75rem", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box", lineHeight: 1.6 }} />
          </div>
          <button onClick={handleScan} disabled={loading} style={{ padding: "13px", border: "none", borderRadius: 12, fontWeight: 700, fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer", background: loading ? "rgba(239,68,68,0.15)" : "linear-gradient(135deg,#dc2626,#9333ea)", color: loading ? "#6b7280" : "white" }}>
            {loading ? "Scanning..." : "⬢ Run Security Scan →"}
          </button>
          {error && <div style={{ padding: "0.875rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 10, color: "#fca5a5", fontSize: "0.78rem" }}>{error}</div>}

          {/* Legend */}
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, padding: "0.875rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>Taint Sources Detected</div>
            {["request", "input()", "os.environ", "argv", "form data"].map(src => (
              <div key={src} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", flexShrink: 0 }} />
                <span style={{ fontSize: "0.72rem", color: "#9ca3af", fontFamily: "monospace" }}>{src}</span>
              </div>
            ))}
            <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", margin: "0.75rem 0 0.6rem" }}>Dangerous Sinks</div>
            {["db.execute() → SQL Injection", "os.system() → Command Injection", "eval() → Code Injection", "open() → Path Traversal"].map(sink => (
              <div key={sink} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                <span style={{ fontSize: "0.68rem", color: "#9ca3af", fontFamily: "monospace" }}>{sink}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: results */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          {!result && !loading && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4rem 2rem", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.15 }}>⬢</div>
              <p style={{ fontSize: "0.85rem", color: "#4b5563" }}>Paste code and run the security scan</p>
              <p style={{ fontSize: "0.72rem", color: "#374151", marginTop: "0.4rem" }}>AST taint analysis traces user input to dangerous sinks</p>
            </div>
          )}

          {loading && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
              <div style={{ width: 40, height: 40, border: "3px solid rgba(239,68,68,0.2)", borderTop: "3px solid #ef4444", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <p style={{ color: "#6b7280", fontSize: "0.82rem" }}>Running AST taint analysis + bandit scan...</p>
            </div>
          )}

          {result && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              {/* Tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 1rem" }}>
                {["taint", "bandit", "ai report"].map(t => (
                  <button key={t} onClick={() => setTab(t)} style={{ padding: "0.75rem 1rem", background: "none", border: "none", borderBottom: tab === t ? "2px solid #ef4444" : "2px solid transparent", color: tab === t ? "#fca5a5" : "#6b7280", fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>{t}</button>
                ))}
                {hasFindings && (
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", padding: "0 0.5rem" }}>
                    <span style={{ fontSize: "0.68rem", padding: "2px 8px", borderRadius: 5, background: "rgba(239,68,68,0.15)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.3)" }}>{dataFlowIssues.length} taint path{dataFlowIssues.length !== 1 ? "s" : ""}</span>
                  </div>
                )}
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
                {tab === "taint"     && <TaintTab issues={dataFlowIssues} complexity={taint?.function_complexity} />}
                {tab === "bandit"    && <BanditTab content={result.bandit_scan} />}
                {tab === "ai report" && <AiTab content={result.ai_security} />}
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      {result && <NextSteps context="security" />}
    </div>
  );
}

function TaintTab({ issues, complexity }) {
  if (!issues?.length) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "3rem", textAlign: "center" }}>
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✅</div>
        <p style={{ color: "#10b981", fontWeight: 600, fontSize: "0.9rem" }}>No taint paths detected</p>
        <p style={{ color: "#4b5563", fontSize: "0.75rem", marginTop: "0.4rem" }}>No user-controlled data flows into dangerous sinks</p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "1rem" }}>Taint Flow Paths — User Input → Dangerous Sink</div>
      {issues.map((issue, i) => {
        const colors = RISK_COLORS[issue.risk] || DEFAULT_RISK;
        return (
          <div key={i} style={{ background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 14, padding: "1.1rem", marginBottom: "1rem" }}>
            {/* Risk badge */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.875rem" }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "3px 10px", borderRadius: 6, background: `${colors.badge}22`, color: colors.badge, border: `1px solid ${colors.badge}44` }}>⚠ {issue.risk}</span>
              <span style={{ fontSize: "0.68rem", color: "#6b7280", fontFamily: "monospace" }}>line {issue.line}</span>
            </div>

            {/* Flow diagram */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.875rem" }}>
              {/* Source */}
              <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "0.4rem 0.75rem" }}>
                <div style={{ fontSize: "0.6rem", color: "#6b7280", marginBottom: "1px" }}>SOURCE</div>
                <div style={{ fontSize: "0.78rem", fontFamily: "monospace", color: "#fca5a5", fontWeight: 600 }}>{issue.source}</div>
              </div>

              {/* Arrow with variable */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
                <div style={{ fontSize: "0.6rem", color: "#6b7280" }}>via</div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: 20, height: 1, background: colors.badge }} />
                  <div style={{ background: `${colors.badge}22`, border: `1px solid ${colors.badge}44`, borderRadius: 5, padding: "2px 7px", fontSize: "0.72rem", fontFamily: "monospace", color: colors.text }}>{issue.variable}</div>
                  <div style={{ width: 20, height: 1, background: colors.badge }} />
                  <div style={{ color: colors.badge, fontSize: "0.8rem" }}>▶</div>
                </div>
              </div>

              {/* Sink */}
              <div style={{ background: `${colors.badge}15`, border: `1px solid ${colors.badge}44`, borderRadius: 8, padding: "0.4rem 0.75rem" }}>
                <div style={{ fontSize: "0.6rem", color: "#6b7280", marginBottom: "1px" }}>SINK</div>
                <div style={{ fontSize: "0.78rem", fontFamily: "monospace", color: colors.text, fontWeight: 600 }}>{issue.sink}</div>
              </div>
            </div>

            {/* Explanation */}
            <div style={{ fontSize: "0.75rem", color: colors.text, lineHeight: 1.5 }}>
              <strong>Risk:</strong> Tainted variable <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>{issue.variable}</code> from <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>{issue.source}</code> flows into <code style={{ background: "rgba(255,255,255,0.08)", padding: "1px 5px", borderRadius: 3, fontFamily: "monospace" }}>{issue.sink}</code> — potential {issue.risk}.
            </div>
          </div>
        );
      })}

      {/* Complexity table */}
      {complexity && Object.keys(complexity).length > 0 && (
        <div style={{ marginTop: "1.25rem" }}>
          <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>Cyclomatic Complexity</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {Object.entries(complexity).map(([fn, score]) => (
              <div key={fn} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${score > 10 ? "rgba(239,68,68,0.3)" : score > 5 ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.07)"}`, borderRadius: 8, padding: "0.4rem 0.75rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#93c5fd" }}>{fn}</span>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: score > 10 ? "#ef4444" : score > 5 ? "#f59e0b" : "#10b981" }}>{score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BanditTab({ content }) {
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>Bandit Static Analysis</div>
      <pre style={{ background: "#0d1117", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "1rem", fontSize: "0.75rem", color: "#c9d1d9", overflowX: "auto", whiteSpace: "pre-wrap", lineHeight: 1.6, margin: 0 }}>{content || "No bandit output."}</pre>
    </div>
  );
}

function AiTab({ content }) {
  return (
    <div>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.875rem" }}>AI Security Report</div>
      <pre style={{ fontSize: "0.82rem", color: "#d1d5db", whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>{content || "No AI report."}</pre>
    </div>
  );
}
