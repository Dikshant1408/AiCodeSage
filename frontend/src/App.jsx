import React, { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";

import Dashboard            from "./pages/Dashboard";
import RepoIntelligencePage from "./pages/RepoIntelligencePage";
import PipelinePage         from "./pages/PipelinePage";
import AnalyticsPage        from "./pages/AnalyticsPage";
import ReviewPage           from "./pages/ReviewPage";
import SecurityPage         from "./pages/SecurityPage";
import DependencyPage       from "./pages/DependencyPage";
import GithubPage           from "./pages/GithubPage";

import SummaryPage           from "./pages/SummaryPage";

const MOBILE_BREAKPOINT = 900;

export default function App({ user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isMobile) setMobileOpen(false);
  }, [isMobile]);

  const effectiveCollapsed = isMobile ? false : collapsed;
  const sideW = effectiveCollapsed ? 52 : 210;

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {isMobile && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: 48,
          zIndex: 240,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 12px",
          background: "rgba(5,8,16,0.98)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(14px)",
        }}>
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.12)",
              color: "#9ca3af",
              borderRadius: 8,
              width: 34,
              height: 34,
              fontSize: "1rem",
              cursor: "pointer",
            }}
            aria-label="Open menu"
          >
            ☰
          </button>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#e5e7eb" }}>AiCodeSage</span>
          <div style={{ width: 34 }} />
        </div>
      )}

      <Sidebar
        collapsed={effectiveCollapsed}
        onToggle={() => setCollapsed(c => !c)}
        user={user}
        onLogout={onLogout}
        mobile={isMobile}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.45)",
            zIndex: 190,
          }}
        />
      )}

      <main style={{ marginLeft: isMobile ? 0 : sideW, paddingTop: isMobile ? 48 : 0, flex: 1, minWidth: 0, transition: "margin-left 0.2s ease" }}>
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/repo"       element={<RepoIntelligencePage />} />
          <Route path="/summary"    element={<SummaryPage />} />
          <Route path="/pipeline"   element={<PipelinePage />} />
          <Route path="/analytics"  element={<AnalyticsPage />} />
          <Route path="/review"     element={<ReviewPage />} />
          <Route path="/security"   element={<SecurityPage />} />
          <Route path="/dependencies" element={<DependencyPage />} />
          <Route path="/github"     element={<GithubPage />} />
        </Routes>
      </main>
    </div>
  );
}
