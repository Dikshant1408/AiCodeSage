/**
 * NextSteps — appears after any analysis result to connect tools together.
 * Pass `context` to get relevant suggestions for the current tool.
 */
import React from "react";
import { Link } from "react-router-dom";

const SUGGESTIONS = {
  review: [
    { to: "/security", icon: "⬢", color: "#ef4444", title: "Security Scan", desc: "Check this code for injection vulnerabilities and hardcoded secrets" },
    { to: "/pipeline", icon: "⚡", color: "#8b5cf6", title: "Auto Fix Pipeline", desc: "Let AI fix the issues found and verify the score improved" },
    { to: "/repo",     icon: "📋", color: "#6366f1", title: "Full Project Report", desc: "Upload your whole project for a complete analysis" },
  ],
  security: [
    { to: "/dependencies", icon: "🔒", color: "#dc2626", title: "CVE Scanner", desc: "Check your dependencies for known vulnerabilities too" },
    { to: "/review",   icon: "◈",  color: "#3b82f6", title: "Code Review",    desc: "Get a quality score and bug list for this code" },
    { to: "/repo",     icon: "📋", color: "#6366f1", title: "Full Project Report", desc: "Run all checks on your entire project at once" },
  ],
  dependencies: [
    { to: "/security", icon: "⬢", color: "#ef4444", title: "Security Scan", desc: "Check your code for injection vulnerabilities too" },
    { to: "/repo",     icon: "📋", color: "#6366f1", title: "Full Project Report", desc: "Get a complete analysis including dependency risks" },
  ],
  pipeline: [
    { to: "/analytics", icon: "📈", color: "#0ea5e9", title: "Quality History", desc: "See how your score has changed over time" },
    { to: "/security",  icon: "⬢", color: "#ef4444", title: "Security Scan",   desc: "Check for security vulnerabilities in the fixed code" },
    { to: "/repo",      icon: "📋", color: "#6366f1", title: "Full Project Report", desc: "Get the complete picture including all issues" },
  ],
  repo: [
    { to: "/pipeline",  icon: "⚡", color: "#8b5cf6", title: "Auto Fix Pipeline", desc: "Paste the worst files here to get AI-generated fixes" },
    { to: "/analytics", icon: "📈", color: "#0ea5e9", title: "Quality History",   desc: "Track how this project improves over time" },
    { to: "/dependencies", icon: "🔒", color: "#dc2626", title: "CVE Scanner", desc: "Check your requirements.txt or package.json for CVEs" },
  ],
  summary: [
    { to: "/repo",     icon: "📋", color: "#6366f1", title: "Full Project Report", desc: "Get every issue with exact locations and how to fix them" },
    { to: "/pipeline", icon: "⚡", color: "#8b5cf6", title: "Auto Fix Pipeline",   desc: "Automatically fix the worst issues in your code" },
  ],
  github: [
    { to: "/summary",  icon: "💬", color: "#a78bfa", title: "Project Summary",    desc: "Get a plain English explanation of what this project does" },
    { to: "/repo",     icon: "📋", color: "#6366f1", title: "Full Project Report", desc: "Upload the ZIP for a complete analysis with all issues" },
  ],
  analytics: [
    { to: "/repo",     icon: "📋", color: "#6366f1", title: "Project Report",     desc: "Run a new analysis to add to your history" },
    { to: "/pipeline", icon: "⚡", color: "#8b5cf6", title: "Auto Fix Pipeline",  desc: "Fix issues and watch your score improve" },
  ],
};

export default function NextSteps({ context }) {
  const steps = SUGGESTIONS[context] || [];
  if (!steps.length) return null;

  return (
    <div style={{ marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
      <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, marginBottom: "0.875rem" }}>
        What to do next
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {steps.map(s => (
          <Link key={s.to} to={s.to} style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", padding: "0.75rem 1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, transition: "border-color 0.12s", cursor: "pointer" }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: s.color + "18", border: `1px solid ${s.color}33`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", flexShrink: 0 }}>
                {s.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "#e5e7eb", marginBottom: "1px" }}>{s.title}</div>
                <div style={{ fontSize: "0.72rem", color: "#6b7280" }}>{s.desc}</div>
              </div>
              <span style={{ fontSize: "0.72rem", color: s.color, fontWeight: 600, flexShrink: 0 }}>→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
