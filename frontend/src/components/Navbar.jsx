import React from "react";
import { Link, useLocation } from "react-router-dom";

const CORE_NAV = [
  { to: "/",         label: "Dashboard"   },
  { to: "/review",   label: "Code Review" },
  { to: "/bugs",     label: "Bugs"        },
  { to: "/explain",  label: "Explain"     },
  { to: "/security", label: "Security"    },
  { to: "/docs",     label: "Docs"        },
  { to: "/tests",    label: "Tests"       },
  { to: "/github",   label: "GitHub"      },
];

const ADVANCED_NAV = [
  { to: "/control-flow",    label: "Control Flow",  icon: "⟳" },
  { to: "/duplicates",      label: "Duplicates",    icon: "⧉" },
  { to: "/autofix",         label: "Auto-Fix",      icon: "🔧" },
  { to: "/debt",            label: "Tech Debt",     icon: "📊" },
  { to: "/debug",           label: "Debugger",      icon: "🐛" },
  { to: "/architecture",    label: "Architecture",  icon: "🏗️" },
  { to: "/bug-fix-agent",   label: "Bug-Fix Agent", icon: "🤖" },
  { to: "/knowledge-graph", label: "Code Graph",    icon: "🕸️" },
];

const EXTRA_NAV = [
  { to: "/polyglot",     label: "Multi-Lang",    icon: "🌐" },
  { to: "/pr-review",    label: "PR Review",     icon: "🔀" },
  { to: "/analytics",    label: "Analytics",     icon: "📈" },
  { to: "/dependencies", label: "Dependencies",  icon: "🔒" },
  { to: "/learning",     label: "Learning",      icon: "🎓" },
  { to: "/benchmark",    label: "Benchmark",     icon: "⚖️" },
  { to: "/autopilot",    label: "Autopilot",     icon: "🚀" },
];

export default function Navbar() {
  const location = useLocation();

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      background: "rgba(5,8,16,0.97)", backdropFilter: "blur(16px)",
      borderBottom: "1px solid rgba(255,255,255,0.07)",
    }}>
      {/* Row 1: Logo + Core nav */}
      <div style={{ display: "flex", alignItems: "center", padding: "0 1.25rem", height: 42, gap: "2px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <Link to="/" style={{ textDecoration: "none", marginRight: "0.75rem", flexShrink: 0 }}>
          <span style={{ fontWeight: 800, fontSize: "0.88rem", background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            AI CodeAssist
          </span>
        </Link>
        {CORE_NAV.map(n => <NavLink key={n.to} to={n.to} label={n.label} active={location.pathname === n.to} />)}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "0.4rem", flexShrink: 0 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399" }} />
          <span style={{ fontSize: "0.68rem", color: "#6b7280" }}>AI Online</span>
        </div>
      </div>

      {/* Row 2: Advanced nav */}
      <div style={{ display: "flex", alignItems: "center", padding: "0 1.25rem", height: 34, gap: "2px", borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
        <span style={{ fontSize: "0.6rem", color: "#4b5563", textTransform: "uppercase", letterSpacing: "0.08em", marginRight: "0.4rem", flexShrink: 0 }}>Advanced</span>
        {ADVANCED_NAV.map(n => <AdvLink key={n.to} to={n.to} label={n.label} icon={n.icon} active={location.pathname === n.to} color="#8b5cf6" />)}
      </div>

      {/* Row 3: Extra features */}
      <div style={{ display: "flex", alignItems: "center", padding: "0 1.25rem", height: 32, gap: "2px" }}>
        <span style={{ fontSize: "0.6rem", color: "#374151", textTransform: "uppercase", letterSpacing: "0.08em", marginRight: "0.4rem", flexShrink: 0 }}>New</span>
        {EXTRA_NAV.map(n => <AdvLink key={n.to} to={n.to} label={n.label} icon={n.icon} active={location.pathname === n.to} color="#10b981" />)}
      </div>
    </nav>
  );
}

function NavLink({ to, label, active }) {
  return (
    <Link to={to} style={{ textDecoration: "none", flexShrink: 0 }}>
      <span style={{
        display: "inline-block", padding: "3px 8px", borderRadius: 6,
        fontSize: "0.74rem", whiteSpace: "nowrap",
        color: active ? "#93c5fd" : "#9ca3af",
        background: active ? "rgba(59,130,246,0.15)" : "transparent",
      }}>{label}</span>
    </Link>
  );
}

function AdvLink({ to, label, icon, active, color }) {
  return (
    <Link to={to} style={{ textDecoration: "none", flexShrink: 0 }}>
      <span style={{
        display: "inline-flex", alignItems: "center", gap: "3px",
        padding: "2px 8px", borderRadius: 5, fontSize: "0.7rem", whiteSpace: "nowrap",
        color: active ? color : "#6b7280",
        background: active ? `${color}22` : "transparent",
        border: active ? `1px solid ${color}44` : "1px solid transparent",
      }}>
        <span style={{ fontSize: "0.75rem" }}>{icon}</span>
        {label}
      </span>
    </Link>
  );
}
