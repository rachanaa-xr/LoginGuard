class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const pad2 = (n) => String(n).padStart(2, "0");

/** Hour of day (0-23) in UTC. Keep it UTC so results are identical on every laptop. */
const hourOf = (iso) => new Date(iso).getUTCHours();

/** Distance between two hours on a 24h clock (23:00 and 01:00 are 2 apart). */
const hourDistance = (a, b) => {
  const d = Math.abs(a - b) % 24;
  return Math.min(d, 24 - d);
};

/** Turns true/false/1/0/yes/no/success/failure... into a boolean, or null if unrecognised. */
function parseBool(v) {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1 ? true : v === 0 ? false : null;
  const s = String(v ?? "").trim().toLowerCase();
  if (["true", "1", "yes", "y", "success", "successful", "ok"].includes(s)) return true;
  if (["false", "0", "no", "n", "failure", "failed", "fail"].includes(s)) return false;
  return null;
}

const unique = (arr) => [...new Set(arr)];

module.exports = { HttpError, pad2, hourOf, hourDistance, parseBool, unique };