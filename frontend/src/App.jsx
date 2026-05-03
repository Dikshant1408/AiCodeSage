import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";

// Core Engine
import Dashboard        from "./pages/Dashboard";
import PipelinePage     from "./pages/PipelinePage";
import SecurityPage     from "./pages/SecurityPage";
import AnalyticsPage    from "./pages/AnalyticsPage";

// Static Intelligence
import ControlFlowPage  from "./pages/ControlFlowPage";
import DuplicatesPage   from "./pages/DuplicatesPage";
import KnowledgeGraphPage from "./pages/KnowledgeGraphPage";
import BugFixAgentPage  from "./pages/BugFixAgentPage";
import PerformancePage  from "./pages/PerformancePage";
import ArchitecturePage from "./pages/ArchitecturePage";
import PolyglotPage     from "./pages/PolyglotPage";

// Data & Memory
import DependencyPage   from "./pages/DependencyPage";
import GithubPage       from "./pages/GithubPage";
import ReviewPage       from "./pages/ReviewPage";
import ReportPage       from "./pages/ReportPage";

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const sideW = collapsed ? 52 : 216;

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main style={{ marginLeft: sideW, flex: 1, minWidth: 0, transition: "margin-left 0.2s ease" }}>
        <Routes>
          <Route path="/"               element={<Dashboard />} />
          <Route path="/pipeline"       element={<PipelinePage />} />
          <Route path="/security"       element={<SecurityPage />} />
          <Route path="/analytics"      element={<AnalyticsPage />} />
          <Route path="/control-flow"   element={<ControlFlowPage />} />
          <Route path="/duplicates"     element={<DuplicatesPage />} />
          <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
          <Route path="/bug-fix-agent"  element={<BugFixAgentPage />} />
          <Route path="/performance"    element={<PerformancePage />} />
          <Route path="/architecture"   element={<ArchitecturePage />} />
          <Route path="/polyglot"       element={<PolyglotPage />} />
          <Route path="/dependencies"   element={<DependencyPage />} />
          <Route path="/github"         element={<GithubPage />} />
          <Route path="/review"         element={<ReviewPage />} />
          <Route path="/report"         element={<ReportPage />} />
        </Routes>
      </main>
    </div>
  );
}
