import React from "react";
import CodeAnalysisPage from "../components/CodeAnalysisPage";
import { findDuplicates } from "../api";

export default function DuplicatesPage() {
  return (
    <CodeAnalysisPage
      title="Duplicate Detector"
      description="Token-based similarity analysis finds duplicate and near-duplicate functions across your code."
      icon="⧉"
      onAnalyze={findDuplicates}
      renderResult={(r) => (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1rem", padding: "0.75rem 1rem", background: r.total_duplicates > 0 ? "rgba(239,68,68,0.08)" : "rgba(16,185,129,0.08)", borderRadius: "12px", border: `1px solid ${r.total_duplicates > 0 ? "#ef444433" : "#10b98133"}` }}>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: r.total_duplicates > 0 ? "#ef4444" : "#10b981" }}>{r.total_duplicates}</span>
            <span style={{ color: "#9ca3af", fontSize: "0.875rem" }}>duplicate group{r.total_duplicates !== 1 ? "s" : ""} found</span>
          </div>

          {r.duplicate_groups?.map((group, i) => (
            <div key={i} style={{ marginBottom: "1rem", borderRadius: "14px", border: "1px solid rgba(239,68,68,0.2)", background: "rgba(239,68,68,0.04)", padding: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#ef4444" }}>Duplicate Group {i + 1}</span>
                <span style={{ padding: "2px 10px", background: "#7f1d1d", borderRadius: "999px", color: "#fca5a5", fontSize: "0.75rem" }}>{group.similarity}% similar</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "0.75rem" }}>
                {group.locations.map((loc, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.8rem" }}>
                    <span style={{ color: "#93c5fd", fontFamily: "monospace" }}>{loc.file}</span>
                    <span style={{ color: "#6b7280" }}>→</span>
                    <span style={{ color: "#a78bfa", fontFamily: "monospace" }}>{loc.function}()</span>
                    <span style={{ color: "#4b5563", fontSize: "0.7rem" }}>lines {loc.start_line}–{loc.end_line}</span>
                  </div>
                ))}
              </div>
              {group.snippet && (
                <pre style={{ fontSize: "0.7rem", color: "#6b7280", fontFamily: "monospace", whiteSpace: "pre-wrap", background: "rgba(0,0,0,0.2)", borderRadius: "8px", padding: "0.5rem", maxHeight: "120px", overflow: "hidden" }}>
                  {group.snippet}
                </pre>
              )}
            </div>
          ))}

          {r.total_duplicates === 0 && (
            <div style={{ color: "#10b981", fontSize: "0.875rem" }}>✓ No duplicate code detected</div>
          )}
        </>
      )}
    />
  );
}
