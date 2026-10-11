const rateLimit = require("express-rate-limit");

const make = (limit, message) => rateLimit({
  windowMs: 60 * 1000,
  limit: Number(process.env.RATE_LIMIT_MAX) || limit,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: message }
});

module.exports = {
  apiLimiter: make(600, "Too many requests. Try again in a minute."),
  importLimiter: make(20, "Too many imports. Try again in a minute.")
};