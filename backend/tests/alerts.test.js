const test = require("node:test");
const assert = require("node:assert");
const os = require("os");
const path = require("path");
const fs = require("fs");
process.env.DATA_FILE = path.join(os.tmpdir(), `lg-alerts-${process.pid}.json`);

const createApp = require("../app");
let server, base;
test.before(async () => { server = createApp().listen(0); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());

const csvForm = (text, name = "logins.csv") => { const f = new FormData(); f.append("file", new Blob([text]), name); return f; };
const CSV = fs.readFileSync(path.join(__dirname, "../../data/samples/sample_logins.csv"), "utf8");
const json = async (p, o) => (await fetch(base + p, o)).json();

test("importing the sample CSV creates events and alerts", async () => {
  const r = await fetch(`${base}/api/events/import`, { method: "POST", body: csvForm(CSV) });
  assert.strictEqual(r.status, 201);
  const out = await r.json();
  assert.ok(out.imported > 100);
  assert.ok(out.alerts_created >= 4);
});

test("importing the same file again skips duplicates", async () => {
  const out = await json("/api/events/import", { method: "POST", body: csvForm(CSV) });
  assert.strictEqual(out.imported, 0);
  assert.ok(out.duplicates > 100);
});

test("import rejects a missing column, bad rows and wrong file type", async () => {
  let r = await fetch(`${base}/api/events/import`, { method: "POST", body: csvForm("user_id,timestamp\nu1,2026-10-01") });
  assert.strictEqual(r.status, 400);
  assert.match((await r.json()).error, /Missing columns/);

  const bad = "user_id,timestamp,ip_address,location,device,success\nu9,not-a-date,203.0.113.1,X,D,true\n";
  const out = await json("/api/events/import", { method: "POST", body: csvForm(bad) });
  assert.strictEqual(out.imported, 0);
  assert.match(out.errors[0], /Row 2/);

  r = await fetch(`${base}/api/events/import`, { method: "POST", body: csvForm("x", "notes.txt") });
  assert.strictEqual(r.status, 400);
});

test("dashboard summary matches the alert list", async () => {
  const s = await json("/api/dashboard/summary");
  const alerts = await json("/api/alerts");
  assert.strictEqual(s.total_alerts, alerts.length);
  assert.strictEqual(s.severity.high + s.severity.medium + s.severity.low, alerts.length);
  assert.ok(s.high_risk >= 1);
  assert.ok(s.recent_alerts.length <= 5);
});

test("alert filters work", async () => {
  const high = await json("/api/alerts?severity=high");
  assert.ok(high.length && high.every((a) => a.severity === "high"));
});

test("alert detail includes event, baseline and reasons", async () => {
  const [first] = await json("/api/alerts?severity=high");
  const d = await json(`/api/alerts/${first.id}`);
  assert.ok(d.event && d.baseline && d.reasons.length);
  assert.ok(d.baseline.devices.length >= 1);
});

test("review saves the decision and rejects bad ones", async () => {
  const [a] = await json("/api/alerts?status=open");
  const patch = (body) => fetch(`${base}/api/alerts/${a.id}/review`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

  assert.strictEqual((await patch({ decision: "banana" })).status, 400);
  const ok = await patch({ decision: "suspicious", note: "confirmed with user" });
  assert.strictEqual((await ok.json()).status, "suspicious");
  assert.strictEqual((await json(`/api/alerts/${a.id}`)).status, "suspicious");
  assert.strictEqual((await json(`/api/alerts/${a.id}/history`)).length, 1);
  assert.strictEqual((await fetch(`${base}/api/alerts/999999/review`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision: "legitimate" }) })).status, 404);
});

test("risky logins stay out of the baseline until an analyst marks them legitimate", async () => {
  const before = await json("/api/baselines/user101");
  assert.ok(!before.devices.includes("Linux / Firefox"));

  const alert = (await json("/api/alerts")).find((a) => a.user_id === "user101");
  await fetch(`${base}/api/alerts/${alert.id}/review`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision: "legitimate" }) });

  const after = await json("/api/baselines/user101");
  assert.ok(after.devices.includes("Linux / Firefox"));
});

test("baselines list every user", async () => {
  const b = await json("/api/baselines");
  assert.ok(b.length >= 5);
  assert.ok(b[0].usual_hours && Array.isArray(b[0].devices) && "failure_rate" in b[0]);
});