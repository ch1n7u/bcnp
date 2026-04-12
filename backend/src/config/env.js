const dotenv = require("dotenv");

dotenv.config();

const required = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

module.exports = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrls: (process.env.FRONTEND_URLS || process.env.FRONTEND_URL || "http://43.204.73.62:3000")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "1d",
  predefinedAdminEmail: process.env.PREDEFINED_ADMIN_EMAIL,
  predefinedAdminPassword: process.env.PREDEFINED_ADMIN_PASSWORD,
  predefinedAdminName: process.env.PREDEFINED_ADMIN_NAME,
  predefinedInvestigatorEmail: process.env.PREDEFINED_INVESTIGATOR_EMAIL,
  predefinedInvestigatorPassword: process.env.PREDEFINED_INVESTIGATOR_PASSWORD,
  predefinedInvestigatorName: process.env.PREDEFINED_INVESTIGATOR_NAME,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || "evidence-files"
};
