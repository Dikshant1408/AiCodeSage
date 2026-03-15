import React from "react";
import CodeAnalysisPage from "../components/CodeAnalysisPage";
import { ResultBlock } from "../components/ResultBlock";
import { securityScan } from "../api";

export default function SecurityPage() {
  return (
    <CodeAnalysisPage
      title="Security Analysis"
      description="Detect SQL injection, hardcoded secrets, unsafe eval, and OWASP vulnerabilities."
      icon="⬢"
      onAnalyze={securityScan}
      renderResult={(r) => (
        <>
          <ResultBlock title="AI Security Report" content={r.ai_security} accent="red" />
          {r.bandit_scan && <ResultBlock title="Bandit Scan" content={r.bandit_scan} mono accent="yellow" />}
        </>
      )}
    />
  );
}
