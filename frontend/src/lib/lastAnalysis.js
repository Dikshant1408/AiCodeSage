/**
 * Shared state between tools via localStorage.
 * Lets Dashboard show real last-analysis data,
 * and lets tools pre-fill from previous results.
 */

export function saveLastAnalysis(data) {
  try {
    localStorage.setItem("acs_last_analysis", JSON.stringify({
      ...data,
      saved_at: new Date().toISOString(),
    }));
  } catch {}
}

export function getLastAnalysis() {
  try {
    const raw = localStorage.getItem("acs_last_analysis");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function clearLastAnalysis() {
  localStorage.removeItem("acs_last_analysis");
}
