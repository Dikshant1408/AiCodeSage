import axios from "axios";

const BASE = `${import.meta.env.VITE_API_URL || "http://localhost:8000"}/api`;

// Core
export const reviewCode    = (code, language = "python") => axios.post(`${BASE}/review/`, { code, language, analyze_functions: true });
export const detectBugs    = (code) => axios.post(`${BASE}/analyze/bugs`, { code });
export const explainCode   = (code) => axios.post(`${BASE}/explain/`, { code });
export const generateDocs  = (code) => axios.post(`${BASE}/docs/`, { code });
export const securityScan  = (code) => axios.post(`${BASE}/security/`, { code });
export const generateTests = (code, language = "python") => axios.post(`${BASE}/tests/`, { code, language });
export const uploadProject = (file) => { const f = new FormData(); f.append("file", file); return axios.post(`${BASE}/analyze/upload`, f); };
export const analyzeGithub = (repo_url) => axios.post(`${BASE}/github/`, { repo_url });
export const chatWithCode  = (session_id, question) => axios.post(`${BASE}/analyze/chat`, { session_id, question });

// Advanced
export const controlFlow        = (code) => axios.post(`${BASE}/advanced/control-flow`, { code });
export const findDuplicates     = (code) => axios.post(`${BASE}/advanced/duplicates`, { code });
export const autoFix            = (code, issue) => axios.post(`${BASE}/advanced/autofix`, { code, issue });
export const architectureScan   = (files) => axios.post(`${BASE}/advanced/architecture`, { files });
export const technicalDebt      = (code) => axios.post(`${BASE}/advanced/technical-debt`, { code });
export const complexityRefactor = (code, function_name = null) => axios.post(`${BASE}/advanced/complexity-refactor`, { code, function_name });
export const debugError         = (error, code = "") => axios.post(`${BASE}/advanced/debug`, { error, code });
export const semanticSearch     = (query, files) => axios.post(`${BASE}/advanced/semantic-search`, { query, files });
export const bugFixAgent        = (files, severity_filter = "all", max_fixes_per_file = 3) => axios.post(`${BASE}/advanced/bug-fix-agent`, { files, severity_filter, max_fixes_per_file });
export const knowledgeGraph     = (files, include_modules = false) => axios.post(`${BASE}/advanced/knowledge-graph`, { files, include_modules });

// Analytics
export const saveAnalysis      = (data) => axios.post(`${BASE}/analytics/save`, data);
export const getHistory        = (repoName, limit = 30) => axios.get(`${BASE}/analytics/history/${encodeURIComponent(repoName)}?limit=${limit}`);
export const listRepos         = () => axios.get(`${BASE}/analytics/repos`);

// Polyglot
export const polyglotAnalyze   = (code, filename) => axios.post(`${BASE}/polyglot/analyze`, { code, filename });
export const multiAnalyze      = (files, parallel = true) => axios.post(`${BASE}/polyglot/multi-analyze`, { files, parallel });

// Extras
export const prReview          = (diff, context = "", repo_name = "") => axios.post(`${BASE}/extras/pr-review`, { diff, context, repo_name });
export const runAutopilot      = (files, max_files = 5) => axios.post(`${BASE}/extras/autopilot`, { files, max_files });
export const architectureRefactor = (architecture_summary) => axios.post(`${BASE}/extras/architecture-refactor`, { architecture_summary });
export const dependencyScan    = (content, filename) => axios.post(`${BASE}/extras/dependency-scan`, { content, filename });
export const runPlugins        = (code, filename, language) => axios.post(`${BASE}/extras/plugins/run`, { code, filename, language });
export const listPlugins       = () => axios.get(`${BASE}/extras/plugins/list`);
export const confidenceScore   = (code, ai_text = "") => axios.post(`${BASE}/extras/confidence-score`, { code, ai_text });
export const incrementalAnalyze = (files, cache = {}) => axios.post(`${BASE}/extras/incremental-analyze`, { files, cache });
export const learningMode      = (code, level = "beginner") => axios.post(`${BASE}/extras/learning-mode`, { code, level });
export const benchmarkModels   = (code, task = "review", models = ["deepseek-coder"]) => axios.post(`${BASE}/extras/benchmark`, { code, task, models });
export const listModels        = () => axios.get(`${BASE}/models`);
