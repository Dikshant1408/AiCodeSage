import React from "react";
import CodeAnalysisPage from "../components/CodeAnalysisPage";
import QualityScore from "../components/QualityScore";
import { technicalDebt } from "../api";

export default function DebtPage() {
  return (
    <CodeAnalysisPage
      title="Technical Debt"
      description="AI calculates debt score, categorizes issues, and estimates refactoring effort."
      icon="📊"
      onAnalyze={technicalDebt}
      renderResult={(r) => (
        <>
          <QualityScore quality={r.quality} />
          <div style={{ borderRadius: "14px", border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.04)", padding: "1rem", marginBottom: "1rem" }}>
            <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#f59e0b", marginBottom: "0.75rem" }}>Technical Debt Report</div>
            <pre style={{ fontSize: "0.85rem", color: "#d1d5db", whiteSpace: "pre-wrap", lineHeight: 1.7 }}>{r.debt_report}</pre>
          </div>
        </>
      )}
    />
  );
}
