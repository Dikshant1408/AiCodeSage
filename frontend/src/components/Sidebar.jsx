import React from "react";
import { Link, useLocation } from "react-router-dom";

const NAV = [
  {
    label: "Pipeline",
    color: "#6366f1",
    items: [
      { to: "/",         icon: "⬡",  label: "Dashboard"        },
      { to: "/pipeline", icon: "⚡",  label: "Autonomous Pipeline" },
      { to: "/security", icon: "⬢",  label: "Security & Taint"  },
      { to: "/analytics",icon: "📈", label: "Quality History"   },
    ],
  },
  {
    label: "Analysis",
    color: "#3b82f6",
    items: [
      { to: "/review",          icon: "◈",  label: "Code Review"      },
      { to: "/bugs",            icon: "◉",  label: "Bug Detection"    },
      { to: "/bug-fix-agent",   icon: "🤖", label: "Bug-Fix Agent"    },
      { to: "/control-flow",    icon: "⟳",  label: "Control Flow"     },
      { to: "/duplicates",      icon: "⧉",  label: "Duplicates"       },
      { to: "/knowledge-graph", icon: "🕸️", label: "Code Graph"       },
      { to: "/performance",     icon: "⚡", label: "Performance"      },
      { to: "/architecture",    icon: "🏗️", label: "Architecture"     },
      { to: "/dependencies",    icon: "🔒", label: "Dependencies"     },
      { to: "/polyglot",        icon: "🌐", label: "Multi-Language"   },
    ],
  },
  {
    label: "Tools",
    color: "#10b981",
    items: [
      { to: "/autofix",   icon: "🔧", label: "Auto-Fix"         },
      { to: "/debt",      icon: "📊", label: "Tech Debt"        },
      { to: "/github",    icon: "🐙", label: "GitHub Analyzer"  },
      { to: "/pr-review", icon: "🔀", label: "PR Review"        },
      { to: "/tests",     icon: "🧪", label: "Test Generator"   },
      { to: "/docs",      icon: "◆",  label: "Docs Generator"   },
      { to: "/report",    icon: "📄", label: "Export Report"    },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();

  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 200,
      width: collapsed ? 52 : 216,
      background: "rgba(5,8,16,0.98)",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      backdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column",
      transition: "width 0.2s ease",
      overflowX: "hidden",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", padding: collapsed ? "13px 0" : "13px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        {!collapsed && (
          <Link to="/" style={{ textDecoration: "none" }}>
            <span style={{ fontWeight: 800, fontSize: "0.82rem", background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AiCodeSage</span>
          </Link>
        )}
        <button onClick={onToggle} style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: "1rem", padding: "2px", flexShrink: 0 }}>
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 0" }}>
        {NAV.map(group => (
          <div key={group.label} style={{ marginBottom: "2px" }}>
            {!collapsed && (
              <div style={{ padding: "8px 12px 3px", fontSize: "0.58rem", color: group.color, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, opacity: 0.7 }}>
                {group.label}
              </div>
            )}
            {group.items.map(item => {
              const active = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "9px",
                    padding: collapsed ? "8px 0" : "6px 12px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius: 7, margin: "1px 5px",
                    background: active ? `${group.color}18` : "transparent",
                    borderLeft: active && !collapsed ? `2px solid ${group.color}` : "2px solid transparent",
                    transition: "background 0.12s",
                  }}>
                    <span style={{ fontSize: "0.9rem", flexShrink: 0 }} title={collapsed ? item.label : ""}>{item.icon}</span>
                    {!collapsed && (
                      <span style={{ fontSize: "0.76rem", color: active ? "#e5e7eb" : "#6b7280", whiteSpace: "nowrap" }}>
                        {item.label}
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Status */}
      <div style={{ padding: collapsed ? "10px 0" : "10px 12px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", alignItems: "center", gap: "6px", justifyContent: collapsed ? "center" : "flex-start", flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", flexShrink: 0 }} />
        {!collapsed && <span style={{ fontSize: "0.65rem", color: "#374151" }}>Groq AI · Online</span>}
      </div>
    </aside>
  );
}
