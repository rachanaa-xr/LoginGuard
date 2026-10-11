const net = require("net");
const { parseBool } = require("./helpers");

const DECISIONS = ["legitimate", "suspicious", "needs_review"];
const MAX_LEN = 100;

const cleanText = (v) => (typeof v === "string" || typeof v === "number" ? String(v).trim() : "");

/**
 * Validates one login event (from JSON or a CSV row).
 * Returns { value } with clean, normalised fields, or { error } with a readable message.
 */
function validateEvent(raw) {
  const r = raw || {};
  const user_id = cleanText(r.user_id);
  const device = cleanText(r.device);
  const ip_address = cleanText(r.ip_address);
  const location = cleanText(r.location) || "Unknown";
  const success = parseBool(r.success);
  const ts = Date.parse(cleanText(r.timestamp));

  if (!user_id) return { error: "user_id is required" };
  if (!device) return { error: "device is required" };
  if (!ip_address || !net.isIP(ip_address)) return { error: `ip_address "${ip_address}" is not a valid IP address` };
  if (!Number.isFinite(ts)) return { error: `timestamp "${cleanText(r.timestamp)}" is not a valid date` };
  if (success === null) return { error: `success must be true or false (got "${cleanText(r.success)}")` };
  for (const [name, v] of [["user_id", user_id], ["device", device], ["location", location]]) {
    if (v.length > MAX_LEN) return { error: `${name} is longer than ${MAX_LEN} characters` };
  }

  return { value: { user_id, timestamp: new Date(ts).toISOString(), ip_address, location, device, success } };
}

function validateReview(raw) {
  const decision = cleanText(raw?.decision);
  const note = cleanText(raw?.note).slice(0, 500);
  if (!DECISIONS.includes(decision)) return { error: `decision must be one of: ${DECISIONS.join(", ")}` };
  return { value: { decision, note } };
}

module.exports = { validateEvent, validateReview, DECISIONS };