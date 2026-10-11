const router = require("express").Router();
const c = require("../controller/alertController");

router.get("/", c.list);

module.exports = router;