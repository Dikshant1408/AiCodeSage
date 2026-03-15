import React from "react";
import CodeAnalysisPage from "../components/CodeAnalysisPage";
import { ResultBlock } from "../components/ResultBlock";
import { explainCode } from "../api";

export default function ExplainPage() {
  return (
    <CodeAnalysisPage
      title="Code Explanation"
      description="Step-by-step breakdown of any code with time and space complexity analysis."
      icon="◎"
      onAnalyze={explainCode}
      renderResult={(r) => (
        <ResultBlock title="Explanation" content={r.explanation} accent="green" />
      )}
    />
  );
}
