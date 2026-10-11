const alertService = require("../services/alertService");

/** GET /api/alerts?severity=high&status=open */
const list = (req, res) => res.json(alertService.list({ severity: req.query.severity, status: req.query.status }));

module.exports = { list };