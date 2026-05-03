import React, { useState } from "react";
import { authLogin, authSignup } from "../api";

export default function AuthPage({ onAuth }) {
  const [mode, setMode]       = useState("login"); // "login" | "signup"
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = mode === "login"
        ? await authLogin(email, password)
        : await authSignup(name, email, password);
      localStorage.setItem("acs_token", res.data.token);
      localStorage.setItem("acs_user",  JSON.stringify(res.data.user));
      onAuth(res.data.user);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050810", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", position: "relative", overflow: "hidden" }}>
      {/* Background glow */}
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 40%, #1e1b4b55 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, #1e3a5f44 0%, transparent 55%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", margin: "0 auto 1rem" }}>⚡</div>
          <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AiCodeSage</h1>
          <p style={{ margin: "6px 0 0", color: "#4b5563", fontSize: "0.8rem" }}>Multi-Agent Code Intelligence Platform</p>
        </div>

        {/* Card */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "2rem", backdropFilter: "blur(20px)" }}>
          {/* Tab toggle */}
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "3px", marginBottom: "1.75rem" }}>
            {["login", "signup"].map(m => (
              <button key={m} onClick={() => { setMode(m); setError(null); }} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: mode === m ? "rgba(99,102,241,0.25)" : "transparent", color: mode === m ? "#a5b4fc" : "#6b7280", fontWeight: mode === m ? 700 : 400, fontSize: "0.82rem", cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize" }}>
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <form onSubmit={handle} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {mode === "signup" && (
              <div>
                <label style={{ fontSize: "0.72rem", color: "#6b7280", display: "block", marginBottom: "5px" }}>Full Name</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required
                  style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#e5e7eb", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                  onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
              </div>
            )}

            <div>
              <label style={{ fontSize: "0.72rem", color: "#6b7280", display: "block", marginBottom: "5px" }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#e5e7eb", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>

            <div>
              <label style={{ fontSize: "0.72rem", color: "#6b7280", display: "block", marginBottom: "5px" }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "signup" ? "Min 6 characters" : "••••••••"} required
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#e5e7eb", fontSize: "0.85rem", outline: "none", boxSizing: "border-box", transition: "border-color 0.15s" }}
                onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.5)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>

            {error && (
              <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, color: "#fca5a5", fontSize: "0.78rem" }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} style={{ padding: "12px", background: loading ? "rgba(99,102,241,0.2)" : "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 12, color: loading ? "#6b7280" : "white", fontWeight: 700, fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer", transition: "all 0.2s", marginTop: "0.25rem" }}>
              {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
            </button>
          </form>

          <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.75rem", color: "#4b5563" }}>
            {mode === "login" ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(null); }} style={{ background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, padding: 0 }}>
              {mode === "login" ? "Sign up" : "Sign in"}
            </button>
          </p>
        </div>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.68rem", color: "#1f2937" }}>
          MCA Final Year Project · AiCodeSage v5.0
        </p>
      </div>
    </div>
  );
}
