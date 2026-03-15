import React from "react";

const ACCENT = {
  blue:   { color: "#60a5fa", bg: "rgba(59,130,246,0.06)",   border: "rgba(59,130,246,0.2)"  },
  red:    { color: "#f87171", bg: "rgba(239,68,68,0.06)",    border: "rgba(239,68,68,0.2)"   },
  green:  { color: "#34d399", bg: "rgba(16,185,129,0.06)",   border: "rgba(16,185,129,0.2)"  },
  yellow: { color: "#fbbf24", bg: "rgba(245,158,11,0.06)",   border: "rgba(245,158,11,0.2)"  },
  purple: { color: "#a78bfa", bg: "rgba(139,92,246,0.06)",   border: "rgba(139,92,246,0.2)"  },
};

export function ResultBlock({ title, content, mono, accent = "blue" }) {
  const a = ACCENT[accent] || ACCENT.blue;
  return (
    <div style={{ borderRadius: 12, border: `1px solid ${a.border}`, background: a.bg, padding: "1rem", marginBottom: "1rem" }}>
      <div style={{ fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: a.color, marginBottom: "0.75rem" }}>
        {title}
      </div>
      <pre style={{ fontSize: mono ? "0.75rem" : "0.875rem", color: "#d1d5db", whiteSpace: "pre-wrap", lineHeight: 1.6, fontFamily: mono ? "monospace" : "inherit", margin: 0 }}>
        {content}
      </pre>
    </div>
  );
}
