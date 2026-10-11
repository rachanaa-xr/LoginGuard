/* events.js – GET /api/events
   Event fields: id, user_id, timestamp, ip_address, location, device, success (boolean) */

let allEvents = [];

async function loadEvents() {
  const box = $("eventContent");
  box.innerHTML = "<p>Loading events…</p>";
  try {
    allEvents = await API.events();
    renderEvents();
  } catch (err) {
    showError(box, err, loadEvents);
  }
}

function renderEvents() {
  const q = $("eventSearch").value.trim().toLowerCase();
  const st = $("eventStatus").value;
  const rows = allEvents.filter(e => {
    if (st === "success" && !isSuccess(e)) return false;
    if (st === "failure" && isSuccess(e)) return false;
    return !q || [e.user_id, e.ip_address, e.location, e.device].some(v => String(v ?? "").toLowerCase().includes(q));
  });
  $("eventCount").textContent = `${rows.length} of ${allEvents.length} events`;
  const box = $("eventContent");
  if (!rows.length) return showEmpty(box, allEvents.length ? "No events match these filters." : "No login events yet. Import a CSV to add some.");
  box.innerHTML = `<table><thead><tr><th>User</th><th>Time</th><th>IP address</th><th>Location</th><th>Device</th><th>Result</th></tr></thead><tbody>
    ${rows.slice(0, 500).map(e => `<tr><td>${esc(e.user_id)}</td><td>${fmtTime(e.timestamp)}</td><td>${esc(e.ip_address)}</td><td>${esc(e.location)}</td><td>${esc(e.device)}</td>
    <td>${isSuccess(e) ? badge("success") : badge("failure")}</td></tr>`).join("")}</tbody></table>
    ${rows.length > 500 ? '<p class="muted">Showing the first 500 matches. Narrow the search to see others.</p>' : ""}`;
}

$("eventSearch").addEventListener("input", renderEvents);
$("eventStatus").addEventListener("change", renderEvents);