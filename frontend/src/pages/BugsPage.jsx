import React from "react";
import CodeAnalysisPage from "../components/CodeAnalysisPage";
import { ResultBlock } from "../components/ResultBlock";
import { detectBugs } from "../api";

export default function BugsPage() {
  return (
    <CodeAnalysisPage
      title="Bug Detection"
      description="AI scans for logical errors, crashes, infinite loops, and runtime issues."
      icon="◉"
      onAnalyze={detectBugs}
      renderResult={(r) => (
        <>
          <ResultBlock title="AI Bug Report" content={r.ai_bugs} accent="red" />
          {r.static_issues && <ResultBlock title="Static Issues (pylint)" content={r.static_issues} mono accent="yellow" />}
        </>
      )}
    />
  );
}
