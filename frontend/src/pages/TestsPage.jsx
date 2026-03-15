import React from "react";
import CodeAnalysisPage from "../components/CodeAnalysisPage";
import { ResultBlock } from "../components/ResultBlock";
import { generateTests } from "../api";

export default function TestsPage() {
  return (
    <CodeAnalysisPage
      title="Test Generator"
      description="AI generates pytest unit tests for every function — happy path, edge cases, and error cases."
      icon="🧪"
      onAnalyze={generateTests}
      renderResult={(r) => (
        <>
          {r.functions_found?.length > 0 && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "1rem", marginBottom: "1rem" }}>
              <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Functions Detected</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {r.functions_found.map(fn => (
                  <span key={fn} style={{ padding: "2px 10px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, fontSize: "0.75rem", color: "#6ee7b7", fontFamily: "monospace" }}>{fn}()</span>
                ))}
              </div>
            </div>
          )}
          <ResultBlock title="Generated Tests" content={r.generated_tests} mono accent="green" />
        </>
      )}
    />
  );
}
