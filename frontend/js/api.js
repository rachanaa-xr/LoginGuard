/* api.js – the only file that talks to the backend, plus small shared helpers. */

async function apiRequest(path, options = {}) {
  let res;
  try {
    res = await fetch(path, options);
  } catch {
    throw new Error("Can't reach the server. Check that it's running (npm run dev).");
  }
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try { const b = await res.json(); msg = b.error || b.message || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

 const API = {
  summary: () => apiRequest("/api/dashboard/summary"),

  events: () => apiRequest("/api/events"),

  alerts: () => apiRequest("/api/alerts"),

  alert: (id) =>
    apiRequest(`/api/alerts/${encodeURIComponent(id)}`),

  review: (id, decision, note = "") =>
    apiRequest(`/api/alerts/${encodeURIComponent(id)}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, note })
    }),

  baselines: () => apiRequest("/api/baselines"),

  analyzeLogin: (data) =>
    apiRequest("/api/login/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    })
};

/* ---------- shared helpers ---------- */
const $ = (id) => document.getElementById(id);

function esc(v) {
  return String(v ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fmtTime(ts) {
  if (!ts) return "–";
  const d = new Date(ts);
  return isNaN(d) ? esc(ts) : d.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

const STATUS_LABELS = { open: "Open", needs_review: "Needs review", suspicious: "Suspicious", legitimate: "Legitimate", success: "Success", failure: "Failed" };
const label = (s) => STATUS_LABELS[s] || esc(s);
const badge = (cls, text) => `<span class="badge ${esc(cls)}">${text ?? label(cls)}</span>`;
const sevBadge = (sev) => badge(sev, esc(String(sev || "unknown").replace(/^./, c => c.toUpperCase())));
const isSuccess = (e) => e.success === true || e.status === "success" || e.result === "success";

function showError(el, err, retry) {
  el.innerHTML = `<div class="notice error">${esc(err.message)} ${retry ? '<button class="btn" data-retry>Try again</button>' : ""}</div>`;
  if (retry) el.querySelector("[data-retry]").addEventListener("click", retry);
}
const showEmpty = (el, msg) => { el.innerHTML = `<div class="empty">${esc(msg)}</div>`; };

function alertRow(a) {
  return `<button class="alert-row" data-open-alert="${esc(a.id)}">
    <span class="score ${esc(a.severity)}">${esc(a.risk_score)}</span>
    <span class="alert-main">
      <strong>Alert ${esc(a.id)} · ${esc(a.user_id)}</strong>
      <span>${esc(a.location || "")} ${a.created_at ? "· " + fmtTime(a.created_at) : ""}</span>
      <ul class="reasons">${(a.reasons || []).map(r => `<li>${esc(r)}</li>`).join("")}</ul>
    </span>
    ${sevBadge(a.severity)} ${badge(a.status)}
  </button>`;
}