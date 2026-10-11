const router = require("express").Router();
const c = require("../controller/investigationController");
const { validateReviewBody } = require("../middleware/validateRequest");

// Mounted at /api/alerts, next to alertRoutes.
router.get("/:id", c.detail);
router.get("/:id/history", c.history);
router.patch("/:id/review", validateReviewBody, c.review);

module.exports = router;