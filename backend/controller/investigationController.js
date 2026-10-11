const investigationService = require("../services/investigationServices");

/** GET /api/alerts/:id */
const detail = (req, res) => res.json(investigationService.getDetail(req.params.id));

/** PATCH /api/alerts/:id/review  { decision, note } */
const review = (req, res) => res.json(investigationService.review(req.params.id, req.valid));

/** GET /api/alerts/:id/history */
const history = (req, res) => res.json(investigationService.history(req.params.id));

module.exports = { detail, review, history };