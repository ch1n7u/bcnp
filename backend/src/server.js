const app = require("./app");
const env = require("./config/env");
const { seedPredefinedUsers } = require("./bootstrap/seedPredefinedUsers");
const logger = require("./utils/logger");

async function startServer() {
  try {
    await seedPredefinedUsers();

    app.listen(env.port, () => {
      logger.info(`Server running on port ${env.port}`);
    });
  } catch (error) {
    logger.critical("Failed to bootstrap server", error);
    process.exit(1);
  }
}

startServer();
