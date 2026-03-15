import React from "react";
import CodeAnalysisPage from "../components/CodeAnalysisPage";
import { controlFlow } from "../api";

const S = {
  section: (color) => ({ marginBottom: "1rem", borderRadius: "14px", border: `1px solid ${color}33`, background: `${color}0a`, padding: "1rem" }),
  label: (color) => ({ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color, marginBottom: "0.75rem" }),
  tag: (color) => ({ display: "inline-block", padding: "2px 10px", borderRadius: "999px", background: `${color}22`, border: `1px solid ${color}44`, fontSize: "0.75rem", color, fontFamily: "monospace", margin: "2px" }),
};

export default function ControlFlowPage() {
  return (
    <CodeAnalysisPage
      title="Control Flow Analysis"
      description="Analyzes execution paths, branch conditions, infinite loop risks, and data flow taint tracking."
      icon="⟳"
      onAnalyze={controlFlow}
      renderResult={(r) => (
        <>
          {/* Function Complexity */}
          {Object.keys(r.function_complexity || {}).length > 0 && (
            <div style={S.section("#3b82f6")}>
              <div style={S.label("#3b82f6")}>Cyclomatic Complexity</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {Object.entries(r.function_complexity).map(([fn, score]) => {
                  const color = score > 10 ? "#ef4444" : score > 5 ? "#f59e0b" : "#10b981";
                  return <span key={fn} style={S.tag(color)}>{fn}() = {score}</span>;
                })}
              </div>
            </div>
          )}

          {/* Infinite Loop Risks */}
          {r.infinite_loop_risks?.length > 0 && (
            <div style={S.section("#ef4444")}>
              <div style={S.label("#ef4444")}>⚠ Infinite Loop Risks ({r.infinite_loop_risks.length})</div>
              {r.infinite_loop_risks.map((risk, i) => (
                <div key={i} style={{ marginBottom: "0.5rem", fontSize: "0.8rem" }}>
                  <span style={{ color: "#f87171", fontFamily: "monospace" }}>{risk.function}()</span>
                  <span style={{ color: "#6b7280" }}> line {risk.line} — </span>
                  <span style={{ color: "#fca5a5" }}>{risk.risk}</span>
                  <div style={{ color: "#9ca3af", fontFamily: "monospace", fontSize: "0.75rem" }}>while {risk.condition}</div>
                </div>
              ))}
            </div>
          )}

          {/* Data Flow Issues */}
          {r.data_flow_issues?.length > 0 && (
            <div style={S.section("#f59e0b")}>
              <div style={S.label("#f59e0b")}>🔒 Data Flow / Taint Issues ({r.data_flow_issues.length})</div>
              {r.data_flow_issues.map((issue, i) => (
                <div key={i} style={{ marginBottom: "0.75rem", fontSize: "0.8rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span style={{ color: "#fbbf24", fontFamily: "monospace" }}>{issue.variable}</span>
                    <span style={{ color: "#6b7280" }}>←</span>
                    <span style={{ color: "#93c5fd" }}>{issue.source}</span>
                    <span style={{ color: "#6b7280" }}>→</span>
                    <span style={{ color: "#f87171", fontFamily: "monospace" }}>{issue.sink}</span>
                    <span style={{ padding: "1px 8px", background: "#7f1d1d", borderRadius: "999px", color: "#fca5a5", fontSize: "0.7rem" }}>{issue.risk}</span>
                  </div>
                  <div style={{ color: "#6b7280", fontSize: "0.7rem" }}>line {issue.line}</div>
                </div>
              ))}
            </div>
          )}

          {/* Branch Paths */}
          {r.branch_paths?.length > 0 && (
            <div style={S.section("#8b5cf6")}>
              <div style={S.label("#8b5cf6")}>Branch Paths ({r.branch_paths.length})</div>
              {r.branch_paths.slice(0, 10).map((b, i) => (
                <div key={i} style={{ marginBottom: "0.75rem", fontSize: "0.8rem", borderLeft: "2px solid #7c3aed", paddingLeft: "0.75rem" }}>
                  <div style={{ color: "#a78bfa", fontFamily: "monospace" }}>{b.function}() — line {b.line}</div>
                  <div style={{ color: "#9ca3af", fontFamily: "monospace", fontSize: "0.75rem" }}>if {b.condition}</div>
                  <div style={{ color: "#34d399", fontSize: "0.75rem" }}>✓ {b.true_path}</div>
                  {b.false_path && b.false_path !== "pass" && (
                    <div style={{ color: "#f87171", fontSize: "0.75rem" }}>✗ {b.false_path}</div>
                  )}
                </div>
              ))}
            </div>
          )}

          {!r.branch_paths?.length && !r.data_flow_issues?.length && !r.infinite_loop_risks?.length && (
            <div style={{ color: "#10b981", fontSize: "0.875rem", padding: "1rem" }}>✓ No control flow issues detected</div>
          )}
        </>
      )}
    />
  );
}
