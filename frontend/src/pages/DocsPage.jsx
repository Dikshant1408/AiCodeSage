import React from "react";
import CodeAnalysisPage from "../components/CodeAnalysisPage";
import { ResultBlock } from "../components/ResultBlock";
import { generateDocs } from "../api";

export default function DocsPage() {
  return (
    <CodeAnalysisPage
      title="Docs Generator"
      description="Auto-generate docstrings, README sections, and API documentation from your code."
      icon="◆"
      onAnalyze={generateDocs}
      renderResult={(r) => (
        <ResultBlock title="Generated Documentation" content={r.documentation} accent="purple" />
      )}
    />
  );
}
