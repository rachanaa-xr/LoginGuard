/* dashboard.js – GET /api/dashboard/summary
   Expected: { total_events, total_alerts, high_risk, pending_reviews,
               severity: {high, medium, low}, recent_alerts: [alert, ...] } */

async function loadDashboard() {
  const box = $("recentAlerts");
  try {
    const s = await API.summary();
    $("totalEvents").textContent = (s.total_events ?? 0).toLocaleString();
    $("totalAlerts").textContent = (s.total_alerts ?? 0).toLocaleString();
    $("highRisk").textContent = (s.high_risk ?? 0).toLocaleString();
    $("pendingReviews").textContent = (s.pending_reviews ?? 0).toLocaleString();

    const recent = s.recent_alerts || [];
    if (recent.length) box.innerHTML = recent.slice(0, 5).map(alertRow).join("");
    else showEmpty(box, "No alerts yet. Import login data to start detection.");

    const sev = s.severity || {};
    const max = Math.max(1, sev.high || 0, sev.medium || 0, sev.low || 0);
    $("severityBars").innerHTML = ["high", "medium", "low"].map(k => `
      <div class="bar-row">${k.charAt(0).toUpperCase() + k.slice(1)}: <strong>${sev[k] || 0}</strong>
        <div class="track"><div class="fill ${k}" style="width:${((sev[k] || 0) / max) * 100}%"></div></div>
      </div>`).join("");
  } catch (err) {
    showError(box, err, loadDashboard);
  }
}