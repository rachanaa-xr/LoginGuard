const logger = require("../utils/logger");

const notFound = (req, res) => res.status(404).json({ error: `No route for ${req.method} ${req.originalUrl}` });

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err.type === "entity.parse.failed") return res.status(400).json({ error: "Request body is not valid JSON." });
  if (err.type === "entity.too.large") return res.status(413).json({ error: "Request body is too large." });
  if (err.code === "LIMIT_FILE_SIZE") return res.status(413).json({ error: "File is too large. The limit is 5 MB." });
  if (err.code === "LIMIT_UNEXPECTED_FILE") return res.status(400).json({ error: 'Upload the file in a field named "file".' });

  const status = err.status || 500;
  if (status >= 500) logger.error(err);
  res.status(status).json({ error: status >= 500 && !err.status ? "Internal server error" : err.message });
}

module.exports = { notFound, errorHandler };