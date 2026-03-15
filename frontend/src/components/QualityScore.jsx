import React from "react";

const gradeColor = { "A+": "#10b981", A: "#34d399", B: "#3b82f6", C: "#f59e0b", D: "#f97316", F: "#ef4444" };
const scoreColor = (s) => s >= 8 ? "#10b981" : s >= 6 ? "#3b82f6" : s >= 4 ? "#f59e0b" : "#ef4444";

export default function QualityScore({ quality }) {
  if (!quality) return null;
  const { score, grade, bugs, security_issues, code_smells, complexity, issues } = quality;
  const color = scoreColor(score);
  const r = 40, circ = 2 * Math.PI * r;
  const dash = circ - ((score / 10) * circ);

  return (
    <div className="glass" style={{ borderRadius: "16px", padding: "1.25rem", marginBottom: "1rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
        <div style={{ position: "relative", width: 88, height: 88, flexShrink: 0 }}>
          <svg width="88" height="88" viewBox="0 0 100 100" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="50" cy="50" r={r} fill="none" stroke="#1f2937" strokeWidth="8" />
            <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={dash}
              style={{ transition: "stroke-dashoffset 1s ease" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "1.2rem", fontWeight: 700, color }}>{score}</span>
            <span style={{ fontSize: "0.65rem", color: "#6b7280" }}>/10</span>
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <span style={{ fontSize: "1.1rem", fontWeight: 700, color: "white" }}>Code Quality</span>
            <span style={{ fontSize: "1.4rem", fontWeight: 900, color: gradeColor[grade] || "#9ca3af" }}>{grade}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "0.5rem" }}>
            <Metric label="Bugs" value={bugs} color="#ef4444" />
            <Metric label="Security" value={security_issues} color="#f97316" />
            <Metric label="Smells" value={code_smells} color="#f59e0b" />
          </div>
          {complexity && complexity !== "N/A" && (
            <p style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.5rem" }}>
              Complexity: <span style={{ color: "#d1d5db" }}>{complexity}</span>
            </p>
          )}
        </div>
      </div>

      {issues?.length > 0 && (
        <div style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          {issues.map((issue, i) => (
            <div key={i} style={{ fontSize: "0.75rem", color: "#9ca3af", display: "flex", gap: "0.5rem", marginBottom: "2px" }}>
              <span style={{ color: "#ef4444" }}>▸</span>{issue}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: "10px", padding: "0.5rem", textAlign: "center" }}>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: "0.7rem", color: "#6b7280" }}>{label}</div>
    </div>
  );
}
