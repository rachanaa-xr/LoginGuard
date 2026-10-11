require("dotenv").config({ quiet: true });
const createApp = require("./app");
const logger = require("./utils/logger");
const { DATA_FILE } = require("./config/database");

const PORT = Number(process.env.PORT) || 3000;

createApp().listen(PORT, () => {
  logger.info(`LoginGuard running at http://localhost:${PORT}`);
  logger.info(`Data file: ${DATA_FILE}`);
});