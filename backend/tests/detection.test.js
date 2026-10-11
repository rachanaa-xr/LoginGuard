const test = require("node:test");
const assert = require("node:assert");
const { analyze } = require("../services/detectionService");
const { assess } = require("../services/riskScoringService");
const { validateEvent } = require("../utils/validators");

const ev = (over = {}) => ({
  user_id: "u1", timestamp: "2026-10-01T09:00:00.000Z", ip_address: "203.0.113.5",
  location: "Bengaluru", device: "Laptop", success: true, ...over
});
// Three normal mornings = a learned baseline
const history = [1, 2, 3].map((d) => ev({ timestamp: `2026-09-2${d}T09:00:00.000Z` }));
const codes = (event, h = history) => analyze(event, h).signals.map((s) => s.code);

test("a normal login raises no signals", () => {
  assert.deepStrictEqual(codes(ev()), []);
});

test("new device, location, IP and odd hour are all detected", () => {
  const c = codes(ev({ device: "Phone", location: "Delhi", ip_address: "192.0.2.9", timestamp: "2026-10-01T21:00:00.000Z" }));
  for (const code of ["NEW_DEVICE", "NEW_LOCATION", "NEW_IP", "UNUSUAL_HOUR"]) assert.ok(c.includes(code), code);
});

test("new-device rules wait until a baseline is learned", () => {
  assert.deepStrictEqual(codes(ev({ device: "Phone" }), history.slice(0, 1)), []);
});

test("3 failures in 15 minutes flags repeated failures", () => {
  const fails = [0, 4].map((m) => ev({ success: false, timestamp: `2026-10-01T09:0${m}:00.000Z` }));
  const c = codes(ev({ success: false, timestamp: "2026-10-01T09:08:00.000Z" }), [...history, ...fails]);
  assert.ok(c.includes("REPEATED_FAILURES"));
});

test("success after a burst of failures is flagged", () => {
  const fails = [0, 2, 4].map((m) => ev({ success: false, timestamp: `2026-10-01T09:0${m}:00.000Z` }));
  assert.ok(codes(ev({ timestamp: "2026-10-01T09:08:00.000Z" }), [...history, ...fails]).includes("SUCCESS_AFTER_FAILURES"));
});

test("a location change within an hour is flagged", () => {
  assert.ok(codes(ev({ location: "Delhi", timestamp: "2026-10-01T09:30:00.000Z" }), [...history, ev({ timestamp: "2026-10-01T09:00:00.000Z" })]).includes("LOCATION_JUMP"));
});

test("scoring caps at 100 and maps severity", () => {
  assert.strictEqual(assess([{ code: "SUCCESS_AFTER_FAILURES", reason: "a" }, { code: "REPEATED_FAILURES", reason: "b" }, { code: "NEW_DEVICE", reason: "c" }]).risk_score, 100);
  assert.strictEqual(assess([{ code: "NEW_DEVICE", reason: "x" }, { code: "NEW_IP", reason: "y" }]).severity, "low");
  assert.strictEqual(assess([{ code: "FAILED_LOGIN", reason: "x" }]).shouldAlert, false);
});

test("validator rejects bad input and normalises good input", () => {
  assert.ok(validateEvent({ ...ev(), ip_address: "not-an-ip" }).error);
  assert.ok(validateEvent({ ...ev(), success: "maybe" }).error);
  assert.ok(validateEvent({ ...ev(), timestamp: "yesterday-ish" }).error);
  assert.strictEqual(validateEvent({ ...ev(), success: "failed" }).value.success, false);
});