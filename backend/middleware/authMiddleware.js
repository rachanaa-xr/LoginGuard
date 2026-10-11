const crypto = require("crypto");

/**
 * Optional API-key protection. Leave API_KEY empty in .env for the demo.
 * If you set it, clients must send the header:  x-api-key: <your key>
 * (the demo frontend doesn't send one, so keep it empty while demoing locally).
 */
function requireApiKey(req, res, next) {
  const expected = process.env.API_KEY;
  if (!expected) return next();

  const given = Buffer.from(String(req.get("x-api-key") || ""));
  const wanted = Buffer.from(expected);
  const ok = given.length === wanted.length && crypto.timingSafeEqual(given, wanted);
  if (!ok) return res.status(401).json({ error: "Missing or invalid API key." });
  next();
}

module.exports = { requireApiKey };