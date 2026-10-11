const router = require("express").Router();
const c = require("../controller/baselineController");

router.get("/", c.list);
router.get("/:userId", c.one);

module.exports = router;