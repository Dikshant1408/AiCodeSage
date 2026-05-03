import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import AuthPage from "./pages/AuthPage";
import "./index.css";

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ background: "#050810", color: "#f87171", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", fontFamily: "monospace", padding: "2rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>💥 Runtime Error</div>
          <pre style={{ color: "#fca5a5", maxWidth: "800px", whiteSpace: "pre-wrap", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "12px", padding: "1.5rem", fontSize: "0.85rem" }}>
            {this.state.error?.message}{"\n\n"}{this.state.error?.stack}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

function Root() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("acs_user")); } catch { return null; }
  });

  const handleAuth = (u) => setUser(u);

  const handleLogout = () => {
    localStorage.removeItem("acs_token");
    localStorage.removeItem("acs_user");
    setUser(null);
  };

  if (!user) return <AuthPage onAuth={handleAuth} />;
  return <App user={user} onLogout={handleLogout} />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <ErrorBoundary>
    <BrowserRouter>
      <Root />
    </BrowserRouter>
  </ErrorBoundary>
);
