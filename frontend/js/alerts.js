/* alerts.js – GET /api/alerts
   Alert fields: id, user_id, risk_score, severity (high|medium|low), reasons[], status, created_at */

let allAlerts = [];
let sevFilter = "all";

async function loadAlerts() {
  const box = $("alertContent");
  box.innerHTML = "<p>Loading alerts…</p>";
  try {
    allAlerts = (await API.alerts()).sort((a, b) => b.risk_score - a.risk_score);
    renderAlerts();
  } catch (err) {
    showError(box, err, loadAlerts);
  }
}

function renderAlerts() {
  const st = $("alertStatus").value;
  const rows = allAlerts.filter(a => (sevFilter === "all" || a.severity === sevFilter) && (st === "all" || a.status === st));
  $("alertCount").textContent = `${rows.length} of ${allAlerts.length} alerts`;
  const box = $("alertContent");
  if (!rows.length) return showEmpty(box, allAlerts.length ? "No alerts match these filters." : "No alerts yet. Import login data to start detection.");
  box.innerHTML = rows.map(alertRow).join("");
}

$("severityChips").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  sevFilter = chip.dataset.sev;
  document.querySelectorAll("#severityChips .chip").forEach(c => c.classList.toggle("active", c === chip));
  renderAlerts();
});
$("alertStatus").addEventListener("change", renderAlerts);