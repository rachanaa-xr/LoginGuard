const router = require("express").Router();
const multer = require("multer");
const c = require("../controller/importController");
const { importLimiter } = require("../middleware/rateLimiter");
const { HttpError } = require("../utils/helpers");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: (req, file, cb) =>
    /\.csv$/i.test(file.originalname) ? cb(null, true) : cb(new HttpError(400, "Only .csv files are accepted."))
});

router.post("/", importLimiter, upload.single("file"), c.importCsv);

module.exports = router;