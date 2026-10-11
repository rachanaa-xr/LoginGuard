const stamp = () => new Date().toISOString();

const logger = {
  info: (...a) => console.log(stamp(), "INFO ", ...a),
  warn: (...a) => console.warn(stamp(), "WARN ", ...a),
  error: (...a) => console.error(stamp(), "ERROR", ...a),
  /** Express middleware: one line per request. */
  requests(req, res, next) {
    const start = Date.now();
    res.on("finish", () => {
      if (req.path.startsWith("/api")) logger.info(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  }
};

module.exports = logger;