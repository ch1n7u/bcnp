const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");
const env = require("../config/env");
const { findByEmail, createUser } = require("../models/userModel");

async function seedPredefinedUsers() {
  const hasAdminSeedConfig = Boolean(
    env.predefinedAdminEmail && env.predefinedAdminPassword && env.predefinedAdminName
  );

  if (hasAdminSeedConfig) {
    const existingAdmin = await findByEmail(env.predefinedAdminEmail);
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(env.predefinedAdminPassword, 12);
      await createUser({
        name: env.predefinedAdminName,
        email: env.predefinedAdminEmail,
        phone: "",
        passwordHash,
        role: "admin"
      });
      logger.info("Predefined admin account created.");
    }
  }

  const hasInvestigatorSeedConfig = Boolean(
    env.predefinedInvestigatorEmail && env.predefinedInvestigatorPassword && env.predefinedInvestigatorName
  );

  if (hasInvestigatorSeedConfig) {
    const existingInvestigator = await findByEmail(env.predefinedInvestigatorEmail);

    if (!existingInvestigator) {
      const passwordHash = await bcrypt.hash(env.predefinedInvestigatorPassword, 12);
      await createUser({
        name: env.predefinedInvestigatorName,
        email: env.predefinedInvestigatorEmail,
        phone: "",
        passwordHash,
        role: "investigator"
      });
      logger.info("Predefined investigator account created.");
    }
  }
}

module.exports = {
  seedPredefinedUsers
};
