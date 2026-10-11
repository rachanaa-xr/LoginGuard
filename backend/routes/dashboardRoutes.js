const router = require("express").Router();
const c = require("../controller/dashboardController");

router.get("/summary", c.summary);

module.exports = router;