import React, { useState } from "react";
import CodeAnalysisPage from "../components/CodeAnalysisPage";
import { ResultBlock } from "../components/ResultBlock";
import QualityScore from "../components/QualityScore";
import { reviewCode } from "../api";

export default function ReviewPage() {
  return (
    <CodeAnalysisPage
      title="Code Review"
      description="Smart parsing extracts every function and class, then AI reviews each one individually."
      icon="◈"
      onAnalyze={reviewCode}
      renderResult={(r) => (
        <>
          <QualityScore quality={r.quality} />

          {(r.functions_found?.length > 0 || r.classes_found?.length > 0) && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Parsed Structure</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.5rem" }}>
                {r.functions_found?.map(fn => (
                  <span key={fn} style={{ padding: "2px 10px", background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: 8, fontSize: "0.75rem", color: "#93c5fd", fontFamily: "monospace" }}>{fn}()</span>
                ))}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {r.classes_found?.map(cls => (
                  <span key={cls} style={{ padding: "2px 10px", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, fontSize: "0.75rem", color: "#c4b5fd", fontFamily: "monospace" }}>{cls}</span>
                ))}
              </div>
            </div>
          )}

          {r.function_analyses?.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Per-Function Analysis</div>
              {r.function_analyses.map((fa) => (
                <FunctionCard key={fa.name} fa={fa} />
              ))}
            </div>
          )}

          <ResultBlock title="Full AI Review" content={r.ai_review} accent="blue" />
          {r.static_analysis?.pylint && <ResultBlock title="pylint" content={r.static_analysis.pylint} mono accent="green" />}
          {r.static_analysis?.flake8 && <ResultBlock title="flake8" content={r.static_analysis.flake8} mono accent="green" />}
        </>
      )}
    />
  );
}

function FunctionCard({ fa }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, overflow: "hidden", marginBottom: "0.5rem" }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer", color: "white" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ color: "#93c5fd", fontFamily: "monospace", fontSize: "0.875rem" }}>{fa.name}()</span>
          <span style={{ fontSize: "0.7rem", color: "#4b5563" }}>line {fa.start_line}–{fa.end_line}</span>
          {fa.params?.length > 0 && <span style={{ fontSize: "0.7rem", color: "#6b7280" }}>{fa.params.join(", ")}</span>}
        </div>
        <span style={{ color: "#4b5563", fontSize: "0.75rem" }}>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {fa.review && <ResultBlock title="Review" content={fa.review} accent="blue" />}
          {fa.bugs && <ResultBlock title="Bugs" content={fa.bugs} accent="red" />}
        </div>
      )}
    </div>
  );
}
