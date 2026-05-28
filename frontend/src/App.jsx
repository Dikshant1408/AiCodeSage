import React, { useState } from "react";
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
import GoogleSearchPage     from "./pages/GoogleSearchPage";

import SummaryPage           from "./pages/SummaryPage";

import HistoryPage           from "./pages/HistoryPage";

export default function App({ user, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const sideW = collapsed ? 52 : 210;

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} user={user} onLogout={onLogout} />
      <main style={{ marginLeft: sideW, flex: 1, minWidth: 0, transition: "margin-left 0.2s ease" }}>
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/repo"       element={<RepoIntelligencePage />} />
          <Route path="/summary"    element={<SummaryPage />} />
          <Route path="/pipeline"   element={<PipelinePage />} />
          <Route path="/analytics"  element={<AnalyticsPage />} />
          <Route path="/history"    element={<HistoryPage />} />
          <Route path="/review"     element={<ReviewPage />} />
          <Route path="/security"   element={<SecurityPage />} />
          <Route path="/dependencies" element={<DependencyPage />} />
          <Route path="/github"     element={<GithubPage />} />
          <Route path="/google-search" element={<GoogleSearchPage />} />
        </Routes>
      </main>
    </div>
  );
}
