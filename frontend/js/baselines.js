/* baselines.js – GET /api/baselines
   Item: { user_id, usual_hours, devices[], locations[], avg_logins_per_day, failure_rate (0-1) } */

let allBaselines = [];

async function loadBaselines() {
  const box = $("baselineContent");
  box.innerHTML = "<p>Loading baselines…</p>";
  try {
    allBaselines = await API.baselines();
    renderBaselines();
  } catch (err) {
    showError(box, err, loadBaselines);
  }
}

function renderBaselines() {
  const q = $("baselineSearch").value.trim().toLowerCase();
  const rows = allBaselines.filter(b => !q || String(b.user_id).toLowerCase().includes(q));
  const box = $("baselineContent");
  if (!rows.length) return showEmpty(box, allBaselines.length ? "No users match this search." : "No baselines yet. They're built from imported login events.");
  const tags = (arr) => `<ul class="reasons">${(arr || []).map(x => `<li>${esc(x)}</li>`).join("") || "<li>None</li>"}</ul>`;
  box.innerHTML = rows.map(b => `<div class="baseline">
    <h3>${esc(b.user_id)}</h3>
    <dl><dt>Login hours</dt><dd>${esc(b.usual_hours || "–")}</dd>
        <dt>Logins per day</dt><dd>${esc(b.avg_logins_per_day ?? "–")}</dd>
        <dt>Failure rate</dt><dd>${b.failure_rate == null ? "–" : Math.round(b.failure_rate * 100) + "%"}</dd></dl>
    <h4>Known devices</h4>${tags(b.devices)}
    <h4>Known locations</h4>${tags(b.locations)}
  </div>`).join("");
}

$("baselineSearch").addEventListener("input", renderBaselines);