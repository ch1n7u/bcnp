const app = require("./app");
const env = require("./config/env");
const { seedPredefinedUsers } = require("./bootstrap/seedPredefinedUsers");

async function startServer() {
  try {
    await seedPredefinedUsers();

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to bootstrap server:", error.message);
    process.exit(1);
  }
}

startServer();
