import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const NAV_GROUPS = [
  {
    label: "Core",
    color: "#3b82f6",
    items: [
      { to: "/",         icon: "⬡",  label: "Dashboard"     },
      { to: "/review",   icon: "◈",  label: "Code Review"   },
      { to: "/bugs",     icon: "◉",  label: "Bug Detection" },
      { to: "/explain",  icon: "◎",  label: "Explain Code"  },
      { to: "/security", icon: "⬢",  label: "Security Scan" },
      { to: "/docs",     icon: "◆",  label: "Docs Generator"},
      { to: "/tests",    icon: "🧪", label: "Test Generator"},
      { to: "/github",   icon: "🐙", label: "GitHub Analyzer"},
    ],
  },
  {
    label: "Advanced",
    color: "#8b5cf6",
    items: [
      { to: "/control-flow",    icon: "⟳",  label: "Control Flow"   },
      { to: "/duplicates",      icon: "⧉",  label: "Duplicates"     },
      { to: "/autofix",         icon: "🔧", label: "Auto-Fix"       },
      { to: "/debt",            icon: "📊", label: "Tech Debt"      },
      { to: "/debug",           icon: "🐛", label: "Debugger"       },
      { to: "/architecture",    icon: "🏗️", label: "Architecture"   },
      { to: "/bug-fix-agent",   icon: "🤖", label: "Bug-Fix Agent"  },
      { to: "/knowledge-graph", icon: "🕸️", label: "Code Graph"     },
    ],
  },
  {
    label: "Intelligence",
    color: "#10b981",
    items: [
      { to: "/polyglot",     icon: "🌐", label: "Multi-Language" },
      { to: "/pr-review",    icon: "🔀", label: "PR Review"      },
      { to: "/autopilot",    icon: "🚀", label: "Autopilot"      },
      { to: "/analytics",    icon: "📈", label: "Analytics"      },
      { to: "/dependencies", icon: "🔒", label: "Dependencies"   },
      { to: "/learning",     icon: "🎓", label: "Learning Mode"  },
      { to: "/benchmark",    icon: "⚖️", label: "Benchmark"      },
      { to: "/performance",  icon: "⚡", label: "Performance"    },
      { to: "/report",       icon: "📄", label: "Export Report"  },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle }) {
  const location = useLocation();
  const [groqStatus, setGroqStatus] = useState(null);

  useEffect(() => {
    const checkStatus = () => {
      axios
        .get(`${API_BASE}/api/health`, { timeout: 5000 })
        .then((res) => setGroqStatus(res.data.groq?.running ?? null))
        .catch(() => setGroqStatus(false));
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const statusColor =
    groqStatus === true ? "#34d399" : groqStatus === false ? "#ef4444" : "#f59e0b";
  const statusLabel =
    groqStatus === true ? "AI Online" : groqStatus === false ? "Groq offline" : "Checking…";
  const statusTitle =
    groqStatus === false ? "GROQ_API_KEY is not set. Add it to your environment variables." : undefined;

  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 200,
      width: collapsed ? 56 : 220,
      background: "rgba(5,8,16,0.98)",
      borderRight: "1px solid rgba(255,255,255,0.07)",
      backdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column",
      transition: "width 0.2s ease",
      overflowX: "hidden",
    }}>
      {/* Logo + toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: collapsed ? "center" : "space-between", padding: collapsed ? "14px 0" : "14px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        {!collapsed && (
          <Link to="/" style={{ textDecoration: "none" }}>
            <span style={{ fontWeight: 800, fontSize: "0.85rem", background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              AI CodeAssist
            </span>
          </Link>
        )}
        <button onClick={onToggle} style={{ background: "none", border: "none", color: "#6b7280", cursor: "pointer", fontSize: "1rem", padding: "2px", flexShrink: 0 }}>
          {collapsed ? "›" : "‹"}
        </button>
      </div>

      {/* Nav groups */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "8px 0" }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} style={{ marginBottom: "4px" }}>
            {!collapsed && (
              <div style={{ padding: "8px 14px 4px", fontSize: "0.6rem", color: "#374151", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {group.label}
              </div>
            )}
            {group.items.map(item => {
              const active = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to} style={{ textDecoration: "none", display: "block" }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: collapsed ? "9px 0" : "7px 14px",
                    justifyContent: collapsed ? "center" : "flex-start",
                    borderRadius: 8, margin: "1px 6px",
                    background: active ? `${group.color}18` : "transparent",
                    borderLeft: active && !collapsed ? `2px solid ${group.color}` : "2px solid transparent",
                    transition: "background 0.15s",
                  }}>
                    <span style={{ fontSize: "0.95rem", flexShrink: 0 }} title={collapsed ? item.label : ""}>{item.icon}</span>
                    {!collapsed && (
                      <span style={{ fontSize: "0.78rem", color: active ? "#e5e7eb" : "#6b7280", whiteSpace: "nowrap" }}>
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
      <div
        style={{
          padding: collapsed ? "10px 0" : "10px 14px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex", alignItems: "center", gap: "6px",
          justifyContent: collapsed ? "center" : "flex-start",
          flexShrink: 0,
        }}
        title={statusTitle}
      >
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor, flexShrink: 0 }} />
        {!collapsed && (
          <span style={{ fontSize: "0.68rem", color: groqStatus === false ? "#ef4444" : "#4b5563" }}>
            {statusLabel}
          </span>
        )}
      </div>
    </aside>
  );
}
