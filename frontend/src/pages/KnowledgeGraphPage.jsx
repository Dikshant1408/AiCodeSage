import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { knowledgeGraph } from "../api";

const NODE_COLOR = {
  file:     "#3b82f6",
  function: "#10b981",
  class:    "#a855f7",
  module:   "#6b7280",
};
const NODE_RADIUS = { file: 14, function: 9, class: 12, module: 7 };
const EDGE_COLOR  = { imports: "#374151", calls: "#10b981", defines: "#1e3a5f", inherits: "#7c3aed" };

export default function KnowledgeGraphPage() {
  const [files, setFiles] = useState({ "app.py": EXAMPLE_CODE });
  const [activeFile, setActiveFile] = useState("app.py");
  const [newName, setNewName] = useState("");
  const [includeModules, setIncludeModules] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const svgRef = useRef(null);
  const simRef = useRef(null);

  const addFile = () => {
    const name = newName.trim() || `file${Object.keys(files).length + 1}.py`;
    setFiles(f => ({ ...f, [name]: "" }));
    setActiveFile(name);
    setNewName("");
  };

  const removeFile = (name) => {
    const updated = { ...files };
    delete updated[name];
    setFiles(updated);
    setActiveFile(Object.keys(updated)[0] || "");
  };

  const handleBuild = async () => {
    setLoading(true); setError(null); setResult(null); setSelected(null);
    try {
      const res = await knowledgeGraph(files, includeModules);
      setResult(res.data);
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    }
    setLoading(false);
  };

  // D3 force graph
  useEffect(() => {
    if (!result || !svgRef.current) return;
    const { nodes, edges } = result;
    if (!nodes.length) return;

    const el = svgRef.current;
    const W = el.clientWidth || 700;
    const H = el.clientHeight || 500;

    d3.select(el).selectAll("*").remove();

    const svg = d3.select(el)
      .attr("width", W).attr("height", H);

    // Zoom
    const g = svg.append("g");
    svg.call(d3.zoom().scaleExtent([0.2, 4]).on("zoom", e => g.attr("transform", e.transform)));

    // Arrow markers
    const defs = svg.append("defs");
    ["calls", "imports", "defines", "inherits"].forEach(type => {
      defs.append("marker")
        .attr("id", `arrow-${type}`)
        .attr("viewBox", "0 -5 10 10").attr("refX", 20).attr("refY", 0)
        .attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
        .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", EDGE_COLOR[type] || "#374151");
    });

    const link = g.append("g").selectAll("line")
      .data(edges).join("line")
      .attr("stroke", d => EDGE_COLOR[d.type] || "#374151")
      .attr("stroke-width", d => d.type === "calls" ? 1.5 : 1)
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", d => `url(#arrow-${d.type})`);

    const nodeGroup = g.append("g").selectAll("g")
      .data(nodes).join("g")
      .style("cursor", "pointer")
      .call(d3.drag()
        .on("start", (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag",  (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on("end",   (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; })
      )
      .on("click", (_, d) => setSelected(d));

    nodeGroup.append("circle")
      .attr("r", d => (NODE_RADIUS[d.type] || 8) + Math.min(d.size - 1, 6))
      .attr("fill", d => NODE_COLOR[d.type] || "#6b7280")
      .attr("fill-opacity", 0.85)
      .attr("stroke", d => NODE_COLOR[d.type] || "#6b7280")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.4);

    nodeGroup.append("text")
      .text(d => d.label.length > 18 ? d.label.slice(0, 16) + "…" : d.label)
      .attr("dy", d => (NODE_RADIUS[d.type] || 8) + 12)
      .attr("text-anchor", "middle")
      .attr("font-size", "10px")
      .attr("fill", "#9ca3af")
      .attr("pointer-events", "none");

    const sim = d3.forceSimulation(nodes)
      .force("link", d3.forceLink(edges)
        .id(d => d.id)
        .distance(d => d.type === "defines" ? 60 : d.type === "calls" ? 100 : 140)
        .strength(0.5))
      .force("charge", d3.forceManyBody().strength(-220))
      .force("center", d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(28))
      .on("tick", () => {
        link
          .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
          .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
        nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);
      });

    simRef.current = sim;
    return () => sim.stop();
  }, [result]);

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        <div className="glass" style={{ width: 56, height: 56, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.8rem" }}>🕸️</div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: "2rem", fontWeight: 800, margin: 0 }}>Code Knowledge Graph</h1>
          <p style={{ color: "#9ca3af", fontSize: "0.875rem", margin: "4px 0 0" }}>Interactive visual map of functions, classes, imports, and call relationships</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: "1.5rem" }}>
        {/* Left panel */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {/* Files */}
          <div className="glass" style={{ borderRadius: 16, padding: "1rem" }}>
            <div style={{ fontSize: "0.7rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Project Files</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", marginBottom: "0.75rem" }}>
              {Object.keys(files).map(name => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                  <button onClick={() => setActiveFile(name)} style={{
                    padding: "3px 10px", borderRadius: 8, border: `1px solid ${activeFile === name ? "rgba(59,130,246,0.4)" : "rgba(255,255,255,0.1)"}`,
                    background: activeFile === name ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.04)",
                    color: activeFile === name ? "#93c5fd" : "#9ca3af", fontSize: "0.72rem", cursor: "pointer", fontFamily: "monospace",
                  }}>{name}</button>
                  {Object.keys(files).length > 1 && (
                    <button onClick={() => removeFile(name)} style={{ background: "none", border: "none", color: "#4b5563", cursor: "pointer", fontSize: "0.7rem" }}>✕</button>
                  )}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <input value={newName} onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === "Enter" && addFile()}
                placeholder="new_file.py"
                style={{ flex: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "5px 10px", color: "#e5e7eb", fontSize: "0.72rem", outline: "none", fontFamily: "monospace" }} />
              <button onClick={addFile} style={{ padding: "5px 10px", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: 8, color: "#93c5fd", fontSize: "0.72rem", cursor: "pointer" }}>+ Add</button>
            </div>
          </div>

          {activeFile && (
            <div className="glass" style={{ borderRadius: 14, overflow: "hidden" }}>
              <div style={{ padding: "7px 12px", borderBottom: "1px solid rgba(255,255,255,0.05)", fontSize: "0.7rem", color: "#6b7280", fontFamily: "monospace" }}>{activeFile}</div>
              <textarea value={files[activeFile] || ""} onChange={e => setFiles(f => ({ ...f, [activeFile]: e.target.value }))}
                style={{ width: "100%", minHeight: "200px", background: "#1e1e1e", border: "none", padding: "0.75rem", color: "#d4d4d4", fontSize: "0.75rem", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
            </div>
          )}

          {/* Options */}
          <div className="glass" style={{ borderRadius: 14, padding: "0.875rem" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer", fontSize: "0.8rem", color: "#9ca3af" }}>
              <input type="checkbox" checked={includeModules} onChange={e => setIncludeModules(e.target.checked)}
                style={{ accentColor: "#3b82f6" }} />
              Show external module nodes
            </label>
          </div>

          <button onClick={handleBuild} disabled={loading}
            style={{ padding: "12px", background: loading ? "#1e3a5f" : "linear-gradient(135deg,#2563eb,#7c3aed)", border: "none", borderRadius: 12, color: "white", fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
            {loading ? "Building graph..." : "🕸️ Build Knowledge Graph →"}
          </button>

          {/* Legend */}
          <div className="glass" style={{ borderRadius: 14, padding: "0.875rem" }}>
            <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.6rem" }}>Legend</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
              {Object.entries(NODE_COLOR).map(([type, color]) => (
                <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: "0.75rem", color: "#9ca3af", textTransform: "capitalize" }}>{type}</span>
                </div>
              ))}
              <div style={{ marginTop: "0.4rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.4rem" }}>
                {Object.entries(EDGE_COLOR).map(([type, color]) => (
                  <div key={type} style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                    <div style={{ width: 16, height: 2, background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: "0.72rem", color: "#6b7280" }}>{type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Selected node info */}
          {selected && (
            <div className="glass" style={{ borderRadius: 14, padding: "0.875rem", border: `1px solid ${NODE_COLOR[selected.type]}44` }}>
              <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>Selected Node</div>
              <div style={{ fontFamily: "monospace", fontSize: "0.875rem", color: NODE_COLOR[selected.type], marginBottom: "0.25rem" }}>{selected.label}</div>
              <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Type: {selected.type}</div>
              {selected.file && <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>File: {selected.file}</div>}
              {selected.line > 0 && <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>Line: {selected.line}</div>}
              {selected.size > 1 && <div style={{ fontSize: "0.75rem", color: "#f59e0b" }}>Called {selected.size - 1}× by other functions</div>}
            </div>
          )}
        </div>

        {/* Right: Graph canvas */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="glass" style={{ borderRadius: 20, overflow: "hidden", flex: 1 }}>
            {error && <div style={{ padding: "1rem", color: "#fca5a5", fontSize: "0.875rem" }}>{error}</div>}
            {!result && !loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "560px", color: "#4b5563", textAlign: "center" }}>
                <div className="float" style={{ fontSize: "4rem", marginBottom: "1rem", opacity: 0.3 }}>🕸️</div>
                <p style={{ fontSize: "0.875rem" }}>Add files and build the graph</p>
                <p style={{ fontSize: "0.75rem", color: "#374151", marginTop: "0.5rem" }}>Drag nodes · Scroll to zoom · Click to inspect</p>
              </div>
            )}
            {loading && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "560px" }}>
                <div style={{ width: 44, height: 44, border: "3px solid #1e3a5f", borderTop: "3px solid #3b82f6", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
                <p style={{ color: "#6b7280", fontSize: "0.875rem" }}>Parsing relationships...</p>
              </div>
            )}
            {result && (
              <svg ref={svgRef} style={{ width: "100%", height: "560px", display: "block" }} />
            )}
          </div>

          {/* Stats + AI summary */}
          {result && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
                <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.75rem" }}>Graph Stats</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  {Object.entries(result.stats).map(([k, v]) => (
                    <div key={k} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "0.5rem", textAlign: "center" }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#60a5fa" }}>{v}</div>
                      <div style={{ fontSize: "0.65rem", color: "#6b7280" }}>{k.replace(/_/g, " ")}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="glass" style={{ borderRadius: 14, padding: "1rem" }}>
                <div style={{ fontSize: "0.65rem", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "0.5rem" }}>AI Summary</div>
                <p style={{ fontSize: "0.8rem", color: "#d1d5db", lineHeight: 1.6, margin: 0 }}>{result.summary}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const EXAMPLE_CODE = `from auth_service import authenticate_user, generate_token
from database import get_user, save_user
import hashlib

class UserController:
    def __init__(self, db):
        self.db = db

    def login(self, username, password):
        user = get_user(username)
        if authenticate_user(user, password):
            return generate_token(user)
        return None

    def register(self, username, password, email):
        hashed = hash_password(password)
        save_user(username, hashed, email)

def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def validate_email(email):
    return "@" in email and "." in email
`;
