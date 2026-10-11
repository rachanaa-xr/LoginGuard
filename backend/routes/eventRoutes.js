const router = require("express").Router();
const c = require("../controller/eventController");
const { validateEventBody } = require("../middleware/validateRequest");

router.get("/", c.list);
router.post("/", validateEventBody, c.create);

module.exports = router;