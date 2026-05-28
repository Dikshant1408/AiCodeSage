import React, { useState } from "react";
import { googleSearch } from "../api";

export default function GoogleSearchPage() {
  const [query, setQuery] = useState("");
  const [numResults, setNumResults] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState("0");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);
    setTotalResults("0");
    try {
      const res = await googleSearch(query.trim(), numResults);
      setResults(res.data?.results || []);
      setTotalResults(res.data?.total_results || "0");
    } catch (e) {
      setError(e.response?.data?.detail || e.message);
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 980, margin: "0 auto", padding: "2rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.4rem" }}>
        <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.45rem" }}>🔎</div>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.9rem", fontWeight: 800, color: "#e5e7eb" }}>Google Search</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "0.82rem" }}>Search from AiCodeSage using Google Programmable Search API.</p>
        </div>
      </div>

      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "1.2rem", marginBottom: "1rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px auto", gap: "0.6rem" }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleSearch()}
            placeholder="Search Google..."
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "#e5e7eb", fontSize: "0.875rem", outline: "none" }}
          />
          <select
            value={numResults}
            onChange={e => setNumResults(Number(e.target.value))}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px", color: "#e5e7eb", fontSize: "0.82rem", outline: "none" }}
          >
            {[3, 5, 7, 10].map(n => <option key={n} value={n} style={{ background: "#111827" }}>{n} results</option>)}
          </select>
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            style={{ padding: "10px 20px", background: loading || !query.trim() ? "rgba(37,99,235,0.2)" : "linear-gradient(135deg,#2563eb,#7c3aed)", border: "none", borderRadius: 10, color: loading || !query.trim() ? "#6b7280" : "white", fontWeight: 600, fontSize: "0.85rem", cursor: loading || !query.trim() ? "not-allowed" : "pointer" }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginTop: "0.7rem", flexWrap: "wrap" }}>
          <a href="https://www.google.com" target="_blank" rel="noreferrer" style={{ color: "#60a5fa", fontSize: "0.74rem", textDecoration: "none" }}>Open google.com in browser ↗</a>
          <span style={{ color: "#4b5563", fontSize: "0.72rem" }}>Requires GOOGLE_SEARCH_API_KEY and GOOGLE_SEARCH_ENGINE_ID in backend .env</span>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: "1rem", padding: "0.9rem 1rem", borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#fca5a5", fontSize: "0.82rem" }}>
          {error}
        </div>
      )}

      {!loading && !error && results.length > 0 && (
        <div style={{ marginBottom: "0.8rem", color: "#9ca3af", fontSize: "0.78rem" }}>
          Showing {results.length} result(s) • Total available: {totalResults}
        </div>
      )}

      {loading && (
        <div style={{ padding: "2rem", textAlign: "center", color: "#6b7280", fontSize: "0.85rem" }}>
          Searching Google...
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
          {results.map((r, idx) => (
            <a
              key={`${r.link}-${idx}`}
              href={r.link}
              target="_blank"
              rel="noreferrer"
              style={{ textDecoration: "none", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "0.95rem 1rem", display: "block" }}
            >
              <div style={{ color: "#93c5fd", fontSize: "0.72rem", marginBottom: "0.35rem" }}>{r.display_link || r.link}</div>
              <div style={{ color: "#e5e7eb", fontSize: "0.95rem", fontWeight: 600, marginBottom: "0.35rem" }}>{r.title || r.link}</div>
              <div style={{ color: "#9ca3af", fontSize: "0.8rem", lineHeight: 1.5 }}>{r.snippet || "No snippet available."}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
