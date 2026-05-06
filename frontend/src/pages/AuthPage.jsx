import React, { useState } from "react";
import { authLogin, authSignup, authForgot, authResetPassword } from "../api";

// mode: "login" | "signup" | "forgot" | "reset"
export default function AuthPage({ onAuth }) {
  const [mode, setMode]         = useState("login");
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetToken, setResetToken]   = useState("");
  const [demoToken, setDemoToken]     = useState("");   // shown when no SMTP
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [success, setSuccess]   = useState(null);

  const reset = (m) => { setMode(m); setError(null); setSuccess(null); setDemoToken(""); };

  const inputStyle = {
    width: "100%", background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10,
    padding: "10px 14px", color: "#e5e7eb", fontSize: "0.85rem",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
  };
  const focusIn  = e => e.target.style.borderColor = "rgba(99,102,241,0.5)";
  const focusOut = e => e.target.style.borderColor = "rgba(255,255,255,0.1)";
  const labelStyle = { fontSize: "0.72rem", color: "#6b7280", display: "block", marginBottom: "5px" };

  // ── Login / Signup ──────────────────────────────────────────────────────────
  const handleAuth = async (e) => {
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

  // ── Forgot Password ─────────────────────────────────────────────────────────
  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true); setError(null); setSuccess(null); setDemoToken("");
    try {
      const res = await authForgot(email);
      setSuccess(res.data.message);
      if (res.data.token) {
        setDemoToken(res.data.token);   // demo mode — show token in UI
        setResetToken(res.data.token);  // pre-fill reset form
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong");
    }
    setLoading(false);
  };

  // ── Reset Password ──────────────────────────────────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords don't match"); return; }
    setLoading(true); setError(null);
    try {
      const res = await authResetPassword(resetToken, newPassword);
      localStorage.setItem("acs_token", res.data.token);
      localStorage.setItem("acs_user",  JSON.stringify(res.data.user));
      onAuth(res.data.user);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid or expired code");
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#050810", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 30% 40%, #1e1b4b55 0%, transparent 55%), radial-gradient(ellipse at 70% 60%, #1e3a5f44 0%, transparent 55%)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 420 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem", margin: "0 auto 1rem" }}>⚡</div>
          <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, background: "linear-gradient(135deg,#60a5fa,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AiCodeSage</h1>
          <p style={{ margin: "6px 0 0", color: "#4b5563", fontSize: "0.8rem" }}>Multi-Agent Code Intelligence Platform</p>
        </div>

        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "2rem", backdropFilter: "blur(20px)" }}>

          {/* ── Login / Signup ── */}
          {(mode === "login" || mode === "signup") && (
            <>
              <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "3px", marginBottom: "1.75rem" }}>
                {["login", "signup"].map(m => (
                  <button key={m} onClick={() => reset(m)} style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: mode === m ? "rgba(99,102,241,0.25)" : "transparent", color: mode === m ? "#a5b4fc" : "#6b7280", fontWeight: mode === m ? 700 : 400, fontSize: "0.82rem", cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize" }}>
                    {m === "login" ? "Sign In" : "Create Account"}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {mode === "signup" && (
                  <div>
                    <label style={labelStyle}>Full Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} placeholder="John Doe" required style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                  </div>
                )}
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "5px" }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
                    {mode === "login" && (
                      <button type="button" onClick={() => reset("forgot")} style={{ background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontSize: "0.72rem", padding: 0 }}>
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "signup" ? "Min 6 characters" : "••••••••"} required style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                </div>

                {error && <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, color: "#fca5a5", fontSize: "0.78rem" }}>{error}</div>}

                <button type="submit" disabled={loading} style={{ padding: "12px", background: loading ? "rgba(99,102,241,0.2)" : "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 12, color: loading ? "#6b7280" : "white", fontWeight: 700, fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer", marginTop: "0.25rem" }}>
                  {loading ? "Please wait..." : mode === "login" ? "Sign In →" : "Create Account →"}
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.75rem", color: "#4b5563" }}>
                {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                <button onClick={() => reset(mode === "login" ? "signup" : "login")} style={{ background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, padding: 0 }}>
                  {mode === "login" ? "Sign up" : "Sign in"}
                </button>
              </p>
            </>
          )}

          {/* ── Forgot Password ── */}
          {mode === "forgot" && (
            <>
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: 700, color: "#e5e7eb" }}>Reset Password</h2>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280" }}>Enter your email and we'll send you a reset code.</p>
              </div>

              <form onSubmit={handleForgot} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                </div>

                {error   && <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)",   border: "1px solid rgba(239,68,68,0.25)",   borderRadius: 10, color: "#fca5a5", fontSize: "0.78rem" }}>{error}</div>}
                {success && <div style={{ padding: "0.75rem 1rem", background: "rgba(16,185,129,0.1)",  border: "1px solid rgba(16,185,129,0.25)",  borderRadius: 10, color: "#6ee7b7", fontSize: "0.78rem" }}>{success}</div>}

                {/* Demo mode: show the token directly */}
                {demoToken && (
                  <div style={{ padding: "1rem", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 12, textAlign: "center" }}>
                    <div style={{ fontSize: "0.65rem", color: "#818cf8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Your Reset Code</div>
                    <div style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "0.3em", color: "#a5b4fc", fontFamily: "monospace" }}>{demoToken}</div>
                    <div style={{ fontSize: "0.65rem", color: "#4b5563", marginTop: "0.4rem" }}>Valid for 1 hour · Use below to set new password</div>
                  </div>
                )}

                <button type="submit" disabled={loading} style={{ padding: "12px", background: loading ? "rgba(99,102,241,0.2)" : "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 12, color: loading ? "#6b7280" : "white", fontWeight: 700, fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? "Sending..." : "Send Reset Code →"}
                </button>

                {demoToken && (
                  <button type="button" onClick={() => reset("reset")} style={{ padding: "11px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 12, color: "#6ee7b7", fontWeight: 600, fontSize: "0.88rem", cursor: "pointer" }}>
                    Enter Reset Code →
                  </button>
                )}
              </form>

              <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.75rem", color: "#4b5563" }}>
                Remember it?{" "}
                <button onClick={() => reset("login")} style={{ background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, padding: 0 }}>Sign in</button>
              </p>
            </>
          )}

          {/* ── Reset Password ── */}
          {mode === "reset" && (
            <>
              <div style={{ marginBottom: "1.5rem" }}>
                <h2 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: 700, color: "#e5e7eb" }}>Set New Password</h2>
                <p style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280" }}>Enter the reset code and your new password.</p>
              </div>

              <form onSubmit={handleReset} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div>
                  <label style={labelStyle}>Reset Code</label>
                  <input value={resetToken} onChange={e => setResetToken(e.target.value.toUpperCase())} placeholder="A3F9C1" required maxLength={6}
                    style={{ ...inputStyle, textAlign: "center", fontSize: "1.3rem", fontWeight: 700, letterSpacing: "0.3em", fontFamily: "monospace" }} onFocus={focusIn} onBlur={focusOut} />
                </div>
                <div>
                  <label style={labelStyle}>New Password</label>
                  <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Min 6 characters" required style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                </div>
                <div>
                  <label style={labelStyle}>Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" required style={inputStyle} onFocus={focusIn} onBlur={focusOut} />
                </div>

                {error && <div style={{ padding: "0.75rem 1rem", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, color: "#fca5a5", fontSize: "0.78rem" }}>{error}</div>}

                <button type="submit" disabled={loading} style={{ padding: "12px", background: loading ? "rgba(99,102,241,0.2)" : "linear-gradient(135deg,#4f46e5,#7c3aed)", border: "none", borderRadius: 12, color: loading ? "#6b7280" : "white", fontWeight: 700, fontSize: "0.9rem", cursor: loading ? "not-allowed" : "pointer" }}>
                  {loading ? "Resetting..." : "Reset Password →"}
                </button>
              </form>

              <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.75rem", color: "#4b5563" }}>
                <button onClick={() => reset("forgot")} style={{ background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontSize: "0.75rem", fontWeight: 600, padding: 0 }}>← Back</button>
              </p>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.68rem", color: "#1f2937" }}>
          MCA Final Year Project · AiCodeSage v5.0
        </p>
      </div>
    </div>
  );
}
