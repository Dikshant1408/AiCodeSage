import React, { useState } from "react";
import { prReview } from "../api";

const EXAMPLE_DIFF = `diff --git a/auth.py b/auth.py
index 1234567..abcdefg 100644
--- a/auth.py
+++ b/auth.py
@@ -10,8 +10,12 @@ class AuthService:
     def login(self, username, password):
-        query = "SELECT * FROM users WHERE name = '" + username + "'"
-        result = self.db.execute(query)
+        query = "SELECT * FROM users WHERE name = ?"
+        result = self.db.execute(query, (username,))
         if result:
-            return True
+            token = self.generate_token(result[0])
+            return token
         return None
 
+    def generate_token(self, user):
+        import secrets
+        return secrets.token_hex(32)
`;

const SEV_COLOR = { critical: "#ef4444", warning: "#f59e0b", suggestion: "#3b82f6" };

export default function PRReviewPage() {
  const [diff, setDiff] = useState(EXAMPLE_DIFF);
  const [context, setContext] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleReview = async () => {
    setLoading(true); setError(null); setResult(null);
    try { const res = await prReview(diff, context); setResult(res.data); }
    catch (e) { setError(e.response?.data?.detail || e.message); }
    setLoading(false);
  };

  // Parse review text into structured comments
  const parseComments = (text) => {
    if (!text) return [];
    const lines = text.split("\n");
    const comments = [];
    for (const line of lines) {
      const m = line.match(/LINE\s+(\d+[–\-]?\d*):\s*\[(critical|warning|suggestion)\]\s*(.+)/i);
      if (m) {
        comments.push({ line: m[1], severity: m[2].toLowerCase(), comment: m[3] });
      }
    }
    return comments;
  };

  const comments = result ? parseComments(result.review) : [];

  return (
    <div style={{ maxWidth: "1300px", margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div className="glass" style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🔀</div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>AI Pull Request Reviewer</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "4px 0 0" }}>Paste a git diff — AI reviews every changed line like GitHub Copilot</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="glass" style={{ borderRadius: 14, padding: "0.875rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>PR Context (optional)</div>
            <input value={context} onChange={e => setContext(e.target.value)} placeholder="e.g. Fixes SQL injection in auth module"
              style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "7px 12px", color: "#e5e7eb", fontSize: "0.8rem", outline: "none", boxSizing: "border-box" }} />
          </div>
          <div className="glass" style={{ borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "7px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.7rem", color: "#6b7280" }}>Git Diff</div>
            <textarea value={diff} onChange={e => setDiff(e.target.value)}
              style={{ width: "100%", minHeight: "380px", background: "#1e1e1e", border: "none", padding: "1rem", color: "#d4d4d4", fontSize: "0.78rem", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
          </div>
          <button onClick={handleReview} disabled={loading}
            style={{ padding: "13px", background: loading ? "#1e3a5f" : "linear-gradient(135deg,#7c3aed,#2563eb)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Reviewing..." : "🔀 Review PR →"}
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {error && <div style={{ padding: "1rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: 12, color: "#fca5a5", fontSize: "0.875rem" }}>{error}</div>}
          {!result && !loading && (
            <div className="glass" style={{ borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px", color: "#4b5563", textAlign: "center" }}>
              <div style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.3 }}>🔀</div>
              <p style={{ fontSize: "0.875rem" }}>Paste a git diff and click Review</p>
            </div>
          )}
          {loading && (
            <div className="glass" style={{ borderRadius: 20, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "400px" }}>
              <div style={{ width: 44, height: 44, border: "3px solid #1e3a5f", borderTop: "3px solid #7c3aed", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
              <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>AI reviewing changes...</p>
            </div>
          )}
          {result && (
            <>
              <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
                <div style={{ display: "flex", gap: "1.5rem" }}>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#3b82f6" }}>{result.diff_lines}</div><div style={{ fontSize: "0.65rem", color: "#6b7280" }}>Diff Lines</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#ef4444" }}>{comments.filter(c => c.severity === "critical").length}</div><div style={{ fontSize: "0.65rem", color: "#6b7280" }}>Critical</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#f59e0b" }}>{comments.filter(c => c.severity === "warning").length}</div><div style={{ fontSize: "0.65rem", color: "#6b7280" }}>Warnings</div></div>
                  <div style={{ textAlign: "center" }}><div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#3b82f6" }}>{comments.filter(c => c.severity === "suggestion").length}</div><div style={{ fontSize: "0.65rem", color: "#6b7280" }}>Suggestions</div></div>
                </div>
              </div>

              {comments.length > 0 && (
                <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
                  <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Inline Comments</div>
                  {comments.map((c, i) => (
                    <div key={i} style={{ padding: "0.75rem", marginBottom: "0.5rem", background: `${SEV_COLOR[c.severity] || "#6b7280"}11`, border: `1px solid ${SEV_COLOR[c.severity] || "#6b7280"}33`, borderRadius: 10 }}>
                      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.25rem" }}>
                        <span style={{ fontFamily: "monospace", fontSize: "0.75rem", color: "#9ca3af" }}>Line {c.line}</span>
                        <span style={{ padding: "1px 8px", borderRadius: 999, background: `${SEV_COLOR[c.severity]}22`, color: SEV_COLOR[c.severity], fontSize: "0.65rem" }}>{c.severity}</span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#d1d5db" }}>{c.comment}</div>
                    </div>
                  ))}
                </div>
              )}

              <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
                <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Full Review</div>
                <pre style={{ fontSize: "0.78rem", color: "#d1d5db", whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>{result.review}</pre>
              </div>
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
