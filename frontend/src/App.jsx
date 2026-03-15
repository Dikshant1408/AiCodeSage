import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ReviewPage from "./pages/ReviewPage";
import BugsPage from "./pages/BugsPage";
import ExplainPage from "./pages/ExplainPage";
import SecurityPage from "./pages/SecurityPage";
import DocsPage from "./pages/DocsPage";
import GithubPage from "./pages/GithubPage";
import TestsPage from "./pages/TestsPage";
import ControlFlowPage from "./pages/ControlFlowPage";
import DuplicatesPage from "./pages/DuplicatesPage";
import AutoFixPage from "./pages/AutoFixPage";
import DebtPage from "./pages/DebtPage";
import DebugPage from "./pages/DebugPage";
import ArchitecturePage from "./pages/ArchitecturePage";
import BugFixAgentPage from "./pages/BugFixAgentPage";
import KnowledgeGraphPage from "./pages/KnowledgeGraphPage";
import PolyglotPage from "./pages/PolyglotPage";
import PRReviewPage from "./pages/PRReviewPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import DependencyPage from "./pages/DependencyPage";
import LearningPage from "./pages/LearningPage";
import BenchmarkPage from "./pages/BenchmarkPage";
import AutopilotPage from "./pages/AutopilotPage";
import PerformancePage from "./pages/PerformancePage";
import ReportPage from "./pages/ReportPage";

export default function App() {
  const [collapsed, setCollapsed] = useState(false);
  const sideW = collapsed ? 56 : 220;

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <main style={{ marginLeft: sideW, flex: 1, minWidth: 0, transition: "margin-left 0.2s ease" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/bugs" element={<BugsPage />} />
          <Route path="/explain" element={<ExplainPage />} />
          <Route path="/security" element={<SecurityPage />} />
          <Route path="/docs" element={<DocsPage />} />
          <Route path="/github" element={<GithubPage />} />
          <Route path="/tests" element={<TestsPage />} />
          <Route path="/control-flow" element={<ControlFlowPage />} />
          <Route path="/duplicates" element={<DuplicatesPage />} />
          <Route path="/autofix" element={<AutoFixPage />} />
          <Route path="/debt" element={<DebtPage />} />
          <Route path="/debug" element={<DebugPage />} />
          <Route path="/architecture" element={<ArchitecturePage />} />
          <Route path="/bug-fix-agent" element={<BugFixAgentPage />} />
          <Route path="/knowledge-graph" element={<KnowledgeGraphPage />} />
          <Route path="/polyglot" element={<PolyglotPage />} />
          <Route path="/pr-review" element={<PRReviewPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/dependencies" element={<DependencyPage />} />
          <Route path="/learning" element={<LearningPage />} />
          <Route path="/benchmark" element={<BenchmarkPage />} />
          <Route path="/autopilot" element={<AutopilotPage />} />
          <Route path="/performance" element={<PerformancePage />} />
          <Route path="/report" element={<ReportPage />} />
        </Routes>
      </main>
    </div>
  );
}
