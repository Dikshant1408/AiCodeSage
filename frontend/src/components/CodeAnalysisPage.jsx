import React, { useState, useRef } from "react";
import Editor from "@monaco-editor/react";

const S = {
  wrap: { maxWidth: "1400px", margin: "0 auto", padding: "2rem" },
  header: { display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" },
  iconBox: { width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" },
  title: { fontSize: "2rem", fontWeight: 800, margin: 0 },
  desc: { color: "#9ca3af", fontSize: "0.875rem", margin: "4px 0 0" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" },
  panel: { borderRadius: "20px", overflow: "hidden" },
  titleBar: { display: "flex", alignItems: "center", gap: "6px", padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)" },
  dot: (c) => ({ width: 12, height: 12, borderRadius: "50%", background: c }),
  btn: (loading) => ({ width: "100%", padding: "12px", background: loading ? "#1e3a5f" : "linear-gradient(135deg,#2563eb,#7c3aed)", border: "none", borderRadius: "12px", color: "white", fontWeight: 600, fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer" }),
  outputPanel: { borderRadius: "20px", overflow: "hidden", display: "flex", flexDirection: "column" },
  outputHeader: { padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" },
  outputBody: { flex: 1, overflowY: "auto", padding: "1.25rem", maxHeight: "520px" },
  empty: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", padding: "4rem 0", color: "#4b5563", textAlign: "center" },
  spinner: { width: 48, height: 48, border: "3px solid #1e3a5f", borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" },
  error: { padding: "1rem", background: "#450a0a", border: "1px solid #7f1d1d", borderRadius: "12px", color: "#fca5a5", fontSize: "0.875rem" },
};

// Parse issue lines from AI output for Monaco decorations
function parseIssueLines(text) {
  const lines = [];
  const patterns = [
    /line\s+(\d+)/gi,
    /Line\s+(\d+)/g,
    /:(\d+):/g,
    /\[(\d+)\]/g,
  ];
  for (const pat of patterns) {
    let m;
    while ((m = pat.exec(text)) !== null) {
      const n = parseInt(m[1]);
      if (n > 0 && n < 10000) lines.push(n);
    }
  }
  return [...new Set(lines)];
}

export default function CodeAnalysisPage({ title, description, icon, onAnalyze, renderResult, defaultCode }) {
  const [code, setCode] = useState(defaultCode || "# Paste your code here\n");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [decorations, setDecorations] = useState([]);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const applyDecorations = (issueLines, warningLines = []) => {
    if (!editorRef.current || !monacoRef.current) return;
    const monaco = monacoRef.current;
    const newDecs = [
      ...issueLines.map(line => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: "monaco-bug-line",
          glyphMarginClassName: "monaco-bug-glyph",
          glyphMarginHoverMessage: { value: "⚠ Possible issue detected" },
          overviewRuler: { color: "#ef4444", position: monaco.editor.OverviewRulerLane.Right },
        },
      })),
      ...warningLines.map(line => ({
        range: new monaco.Range(line, 1, line, 1),
        options: {
          isWholeLine: true,
          className: "monaco-warn-line",
          glyphMarginClassName: "monaco-warn-glyph",
          glyphMarginHoverMessage: { value: "💡 Suggestion available" },
        },
      })),
    ];
    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, newDecs);
  };

  const handleRun = async () => {
    setLoading(true); setError(null);
    // Clear decorations
    if (editorRef.current) {
      decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, []);
    }
    try {
      const res = await onAnalyze(code);
      setResult(res.data);
      // Apply inline decorations from AI output
      const allText = JSON.stringify(res.data);
      const issueLines = parseIssueLines(allText);
      if (issueLines.length > 0) {
        setTimeout(() => applyDecorations(issueLines), 100);
      }
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    }
    setLoading(false);
  };

  return (
    <div style={S.wrap}>
      <div style={S.header}>
        <div className="glass" style={S.iconBox}>{icon}</div>
        <div>
          <h1 className="gradient-text" style={S.title}>{title}</h1>
          <p style={S.desc}>{description}</p>
        </div>
      </div>

      <div style={S.grid}>
        {/* Editor */}
        <div className="glass" style={S.panel}>
          <div style={S.titleBar}>
            <div style={S.dot("#ef4444")} /><div style={S.dot("#f59e0b")} /><div style={S.dot("#10b981")} />
            <span style={{ marginLeft: "auto", fontSize: "0.75rem", color: "#6b7280", fontFamily: "monospace" }}>editor.py</span>
          </div>
          <Editor
            height="460px"
            defaultLanguage="python"
            theme="vs-dark"
            value={code}
            onChange={(v) => setCode(v || "")}
            onMount={(editor, monaco) => { editorRef.current = editor; monacoRef.current = monaco; }}
            options={{ fontSize: 14, minimap: { enabled: false }, scrollBeyondLastLine: false, padding: { top: 12 }, fontFamily: "monospace", glyphMargin: true }}
          />
          <div style={{ padding: "1rem", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <button onClick={handleRun} disabled={loading} style={S.btn(loading)}>
              {loading ? "AI is thinking..." : `Run ${title} →`}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="glass" style={S.outputPanel}>
          <div style={S.outputHeader}>
            <span style={{ fontSize: "0.875rem", color: "#d1d5db" }}>AI Output</span>
            {result && <span style={{ fontSize: "0.75rem", color: "#34d399" }}>✓ Complete</span>}
          </div>
          <div style={S.outputBody}>
            {!result && !error && !loading && (
              <div style={S.empty}>
                <div className="float" style={{ fontSize: "3rem", marginBottom: "1rem", opacity: 0.4 }}>{icon}</div>
                <p style={{ fontSize: "0.875rem" }}>Paste your code and click Run</p>
                <p style={{ fontSize: "0.75rem", color: "#374151", marginTop: "0.5rem" }}>Issues will be highlighted inline in the editor</p>
              </div>
            )}
            {loading && (
              <div style={{ ...S.empty }}>
                <AnalysisTimeline />
              </div>
            )}
            {error && <div style={S.error}><strong>Error:</strong> {error}</div>}
            {result && renderResult(result)}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .monaco-bug-line { background: rgba(239,68,68,0.08) !important; border-left: 2px solid #ef4444; }
        .monaco-warn-line { background: rgba(245,158,11,0.08) !important; border-left: 2px solid #f59e0b; }
      `}</style>
    </div>
  );
}

const TIMELINE_STEPS = [
  "Parsing code structure...",
  "Running static analysis...",
  "Sending to AI model...",
  "Analyzing with DeepSeek Coder...",
  "Generating report...",
];

function AnalysisTimeline() {
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setStep(s => Math.min(s + 1, TIMELINE_STEPS.length - 1)), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div style={{ width: "100%", padding: "1rem 0" }}>
      <div style={{ width: 40, height: 40, border: "3px solid #1e3a5f", borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 1.5rem" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        {TIMELINE_STEPS.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", opacity: i <= step ? 1 : 0.25, transition: "opacity 0.4s" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: i < step ? "#10b981" : i === step ? "#3b82f6" : "#374151", flexShrink: 0 }} />
            <span style={{ fontSize: "0.8rem", color: i <= step ? "#d1d5db" : "#4b5563" }}>{s}</span>
            {i === step && <span style={{ fontSize: "0.7rem", color: "#3b82f6" }}>●</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
