const test = require("node:test");
const assert = require("node:assert");
const os = require("os");
const path = require("path");
process.env.DATA_FILE = path.join(os.tmpdir(), `lg-events-${process.pid}.json`);

const createApp = require("../app");
let server, base;
test.before(async () => { server = createApp().listen(0); base = `http://127.0.0.1:${server.address().port}`; });
test.after(() => server.close());

const post = (body) => fetch(`${base}/api/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
const login = (h, o = {}) => ({ user_id: "t1", timestamp: `2026-10-01T0${h}:00:00Z`, ip_address: "203.0.113.5", location: "Bengaluru", device: "Laptop", success: true, ...o });

test("health check", async () => {
  assert.deepStrictEqual(await (await fetch(`${base}/api/health`)).json(), { status: "ok", service: "LoginGuard API" });
});

test("rejects invalid events with a readable message", async () => {
  const r = await post({ user_id: "t1" });
  assert.strictEqual(r.status, 400);
  assert.match((await r.json()).error, /required|valid/);
});

test("rejects malformed JSON", async () => {
  const r = await fetch(`${base}/api/events`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{oops" });
  assert.strictEqual(r.status, 400);
});

test("scores events and builds an alert after a baseline exists", async () => {
  for (const h of [7, 8, 9]) assert.strictEqual((await post(login(h))).status, 201);
  const r = await post(login(5, { device: "Unknown", location: "Delhi", ip_address: "192.0.2.1", timestamp: "2026-10-01T21:30:00Z" }));
  const { event, alert } = await r.json();
  assert.ok(event.risk_score >= 70);
  assert.strictEqual(alert.severity, "high");
  assert.ok(alert.reasons.length >= 3);
});

test("lists events newest first", async () => {
  const rows = await (await fetch(`${base}/api/events`)).json();
  assert.ok(rows.length >= 4);
  assert.ok(Date.parse(rows[0].timestamp) >= Date.parse(rows[1].timestamp));
});

test("unknown API routes return JSON 404", async () => {
  const r = await fetch(`${base}/api/nope`);
  assert.strictEqual(r.status, 404);
  assert.ok((await r.json()).error);
});