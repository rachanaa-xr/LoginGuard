/* import.js – POST /api/events/import (multipart field name: "file")
   Response: { imported, skipped, alerts_created, errors: [string] } */

const REQUIRED_COLUMNS = ["user_id", "timestamp", "ip_address", "location", "device", "success"]; // match your backend
const MAX_MB = 5;
let fileOk = false;

$("importHint").textContent = `Required columns: ${REQUIRED_COLUMNS.join(", ")}. Maximum size ${MAX_MB} MB.`;

function setNotice(text, type) {
  const n = $("importValidation");
  n.className = `notice ${type || ""}`;
  n.textContent = text;
  n.classList.toggle("hidden", !text);
}

$("csvFile").addEventListener("change", async () => {
  const f = $("csvFile").files[0];
  fileOk = false;
  $("importBtn").disabled = true;
  $("importResult").innerHTML = "";
  if (!f) return setNotice("");
  if (!f.name.toLowerCase().endsWith(".csv")) return setNotice("This isn't a .csv file. Export your data as CSV and try again.", "error");
  if (f.size > MAX_MB * 1024 * 1024) return setNotice(`This file is larger than ${MAX_MB} MB. Split it into smaller files.`, "error");
  if (f.size === 0) return setNotice("This file is empty.", "error");

  const head = (await f.slice(0, 4096).text()).replace(/^\uFEFF/, "").split(/\r?\n/)[0];
  const cols = head.split(",").map(c => c.trim().replace(/^"|"$/g, "").toLowerCase());
  const missing = REQUIRED_COLUMNS.filter(c => !cols.includes(c));
  if (missing.length) return setNotice(`Missing column${missing.length > 1 ? "s" : ""}: ${missing.join(", ")}. Add them to the header row.`, "error");

  fileOk = true;
  $("importBtn").disabled = false;
  setNotice(`${f.name} looks good (${(f.size / 1024).toFixed(1)} KB). Ready to import.`, "ok");
});

$("importForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = $("csvFile").files[0];
  if (!f || !fileOk) return;

  const data = new FormData();
  data.append("file", f);
  const bar = $("importProgress"), fill = bar.firstElementChild, result = $("importResult");
  bar.classList.remove("hidden");
  fill.style.width = "0";
  result.innerHTML = "";
  $("importBtn").disabled = true;

  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/events/import");
  xhr.upload.onprogress = (ev) => { if (ev.lengthComputable) fill.style.width = `${(ev.loaded / ev.total) * 90}%`; };
  xhr.onload = () => {
    fill.style.width = "100%";
    let body = {};
    try { body = JSON.parse(xhr.responseText); } catch {}
    if (xhr.status >= 200 && xhr.status < 300) {
      const errs = body.errors || [];
      result.innerHTML = `<div class="notice ok">Import finished: ${esc(body.imported ?? 0)} events added, ${esc(body.skipped ?? 0)} skipped, ${esc(body.alerts_created ?? 0)} alerts created.</div>
        ${errs.length ? `<div class="notice error"><strong>Rows with problems</strong><ul>${errs.slice(0, 10).map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>` : ""}
        <button class="btn" data-goto="alerts">View alerts</button>`;
    } else {
      result.innerHTML = `<div class="notice error">${esc(body.error || body.message || `Import failed (${xhr.status}).`)}</div>`;
      $("importBtn").disabled = false;
    }
  };
  xhr.onerror = () => {
    bar.classList.add("hidden");
    result.innerHTML = '<div class="notice error">Can\'t reach the server. Check that it\'s running and try again.</div>';
    $("importBtn").disabled = false;
  };
  xhr.send(data);
});