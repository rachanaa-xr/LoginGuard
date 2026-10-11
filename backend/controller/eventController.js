const eventModel = require("../models/eventModel");
const detectionService = require("../services/detectionService");

/** GET /api/events  (newest first; ?limit=100 to trim) */
function list(req, res) {
  const limit = Math.min(Number(req.query.limit) || 2000, 10000);
  const rows = eventModel.all().slice().sort((a, b) => Date.parse(b.timestamp) - Date.parse(a.timestamp));
  res.json(rows.slice(0, limit));
}

/** POST /api/events – score one login (body already validated). */
function create(req, res) {
  const { event, alert } = detectionService.processLoginEvent(req.valid);
  res.status(201).json({ event, alert });
}

module.exports = { list, create };