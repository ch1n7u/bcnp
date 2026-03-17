const bcrypt = require("bcryptjs");
const { findByEmail, createUser } = require("../models/userModel");

const ANONYMOUS_REPORTER_EMAIL = "anonymous@ccrp.local";

async function getAnonymousReporterId() {
  const existing = await findByEmail(ANONYMOUS_REPORTER_EMAIL);
  if (existing) return existing.id;

  const randomPassword = `anon-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const passwordHash = await bcrypt.hash(randomPassword, 12);

  const created = await createUser({
    name: "Anonymous Reporter",
    email: ANONYMOUS_REPORTER_EMAIL,
    phone: "",
    passwordHash,
    role: "citizen"
  });

  return created.id;
}

module.exports = {
  ANONYMOUS_REPORTER_EMAIL,
  getAnonymousReporterId
};
