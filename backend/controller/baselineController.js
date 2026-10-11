const baselineService = require("../services/baselineServices");

/** GET /api/baselines */
const list = (req, res) => res.json(baselineService.listAll());

/** GET /api/baselines/:userId */
const one = (req, res) => res.json(baselineService.forUser(req.params.userId));

module.exports = { list, one };