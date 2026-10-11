const alertService = require("../services/alertService");

/** GET /api/dashboard/summary */
const summary = (req, res) => res.json(alertService.summary());

module.exports = { summary };