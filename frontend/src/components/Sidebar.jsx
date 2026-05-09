import React from "react";
import { Link, useLocation } from "react-router-dom";

const NAV = [
  {
    label: "Project",
    color: "#6366f1",
    items: [
      { to: "/",         icon: "⬡",  label: "Dashboard"        },
      { to: "/summary",  icon: "💬", label: "Project Summary"  },
      { to: "/repo",     icon: "📋", label: "Project Report"   },
      { to: "/pipeline", icon: "⚡",  label: "Auto Fix Pipeline"},
      { to: "/analytics",icon: "📈", label: "Quality History"  },
    ],
  },
  {
    label: "Analysis",
    color: "#3b82f6",
    items: [
      { to: "/review",       icon: "◈",  label: "Code Review"    },
      { to: "/security",     icon: "⬢",  label: "Security Scan"  },
      { to: "/dependencies", icon: "🔒", label: "CVE Scanner"    },
      { to: "/github",       icon: "🐙", label: "GitHub Chat"    },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, user, onLogout, mobile = false, open = true, onClose }) {
  const location = useLocation();
  const isCollapsed = mobile ? false : collapsed;
  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, bottom: 0, zIndex: mobile ? 260 : 200,
      width: isCollapsed ? 52 : 210,
      background: "rgba(5,8,16,0.98)",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      backdropFilter: "blur(20px)",
      display: "flex", flexDirection: "column",
      transition: "width 0.2s ease, transform 0.2s ease",
      overflowX: "hidden",
      transform: mobile && !open ? "translateX(-100%)" : "translateX(0)",
      boxShadow: mobile ? "0 8px 30px rgba(0,0,0,0.45)" : "none",
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: isCollapsed ? "center" : "space-between", padding: isCollapsed ? "13px 0" : "13px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
        {!isCollapsed && (
          <Link to="/" style={{ textDecoration: "none" }}>
            <span style={{ fontWeight: 800, fontSize: "0.82rem", background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AiCodeSage</span>
          </Link>
        )}
        {mobile ? (
          <button onClick={onClose} style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", color: "#9ca3af", cursor: "pointer", fontSize: "0.95rem", padding: "3px 7px", borderRadius: 7, flexShrink: 0 }}>
            ✕
          </button>
        ) : (
          <button onClick={onToggle} style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: "1rem", padding: "2px", flexShrink: 0 }}>
            {isCollapsed ? "›" : "‹"}
          </button>
        )}
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 0" }}>
        {NAV.map(group => (
          <div key={group.label} style={{ marginBottom: "4px" }}>
            {!isCollapsed && (
              <div style={{ padding: "8px 12px 3px", fontSize: "0.58rem", color: group.color, textTransform: "uppercase", letterSpacing: "0.12em", fontWeight: 700, opacity: 0.8 }}>
                {group.label}
              </div>
            )}
            {group.items.map(item => {
              const active = location.pathname === item.to;
              return (
                <Link key={item.to} to={item.to} style={{ textDecoration: "none", display: "block" }} onClick={() => mobile && onClose && onClose()}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "9px",
                    padding: isCollapsed ? "9px 0" : "7px 12px",
                    justifyContent: isCollapsed ? "center" : "flex-start",
                    borderRadius: 7, margin: "1px 5px",
                    background: active ? `${group.color}18` : "transparent",
                    borderLeft: active && !isCollapsed ? `2px solid ${group.color}` : "2px solid transparent",
                    transition: "background 0.12s",
                  }}>
                    <span style={{ fontSize: "0.9rem", flexShrink: 0 }} title={isCollapsed ? item.label : ""}>{item.icon}</span>
                    {!isCollapsed && <span style={{ fontSize: "0.76rem", color: active ? "#e5e7eb" : "#6b7280", whiteSpace: "nowrap" }}>{item.label}</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* User + logout */}
      <div style={{ padding: isCollapsed ? "10px 0" : "10px 12px", borderTop: "1px solid rgba(255,255,255,0.05)", flexShrink: 0 }}>
        {!isCollapsed && user && (
          <div style={{ marginBottom: "8px" }}>
            <div style={{ fontSize: "0.72rem", color: "#e5e7eb", fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.name}</div>
            <div style={{ fontSize: "0.62rem", color: "#4b5563", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user.email}</div>
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", justifyContent: isCollapsed ? "center" : "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", flexShrink: 0 }} />
            {!isCollapsed && <span style={{ fontSize: "0.62rem", color: "#374151" }}>Online</span>}
          </div>
          {!isCollapsed && (
            <button onClick={() => { onLogout(); if (mobile && onClose) onClose(); }} style={{ background: "none", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 6, color: "#4b5563", cursor: "pointer", fontSize: "0.65rem", padding: "3px 8px" }}>
              Sign out
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
