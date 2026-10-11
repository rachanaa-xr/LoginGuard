const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config({ quiet: true });

const logger = require("./utils/logger");
const { apiLimiter } = require("./middleware/rateLimiter");
const { requireApiKey } = require("./middleware/authMiddleware");
const { notFound, errorHandler } = require("./middleware/errorHandler");

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  // The frontend is served by this same server, so CORS is off unless you set CORS_ORIGIN.
  app.use(cors({ origin: process.env.CORS_ORIGIN || false }));
  app.use(express.json({ limit: "50kb" }));
  app.use(logger.requests);

  app.get("/api/health", (req, res) => res.json({ status: "ok", service: "LoginGuard API" }));

  app.use("/api", apiLimiter, requireApiKey);
  app.use("/api/dashboard", require("./routes/dashboardRoutes"));
  app.use("/api/events/import", require("./routes/importRoutes")); // before /api/events
  app.use("/api/events", require("./routes/eventRoutes"));
  app.use("/api/alerts", require("./routes/alertRoutes"));
  app.use("/api/alerts", require("./routes/investigationRoutes"));
  app.use("/api/baselines", require("./routes/baselineRoutes"));
  const loginAnalysisRoutes = require("./routes/loginAnalysis");

  app.use("/api/login", loginAnalysisRoutes);

  app.use("/api", notFound);
  // Serve the website from /frontend
  app.use(express.static(path.join(__dirname, "../frontend")));

  app.use(errorHandler);
  return app;
}

module.exports = createApp;