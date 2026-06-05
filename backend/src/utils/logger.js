const crypto = require("crypto");

function redactSensitiveData(data) {
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  // Handle standard Error serialization
  if (data instanceof Error) {
    return {
      message: data.message,
      stack: data.stack,
      name: data.name,
      code: data.code,
      statusCode: data.statusCode
    };
  }

  const keysToRedact = new Set([
    "password", "password_hash", "passwordhash", "token", "ccrp_token", 
    "authorization", "otp", "otpcode", "otp_code", "jwt", "secret", "key", 
    "smtp_pass", "supabase_service_role_key", "jwt_secret", "pass", "cookie",
    "csrf", "csrftoken", "x-csrf-token"
  ]);

  const keysToMask = {
    email: (val) => {
      if (typeof val !== "string") return val;
      const parts = val.split("@");
      if (parts.length !== 2) return "***";
      const name = parts[0];
      const domain = parts[1];
      if (name.length <= 2) return `*@${domain}`;
      return `${name[0]}***${name[name.length - 1]}@${domain}`;
    },
    phone: (val) => {
      if (typeof val !== "string") return val;
      if (val.length <= 4) return "****";
      return `******${val.slice(-4)}`;
    },
    phone_number: (val) => keysToMask.phone(val),
    phoneNumber: (val) => keysToMask.phone(val),
    name: (val) => {
      if (typeof val !== "string") return val;
      const parts = val.trim().split(/\s+/);
      return parts.map(p => p.length > 1 ? `${p[0]}***` : "*").join(" ");
    },
    victim_name: (val) => keysToMask.name(val),
    victimName: (val) => keysToMask.name(val)
  };

  const clone = Array.isArray(data) ? [] : {};
  
  for (const [key, val] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    if (keysToRedact.has(lowerKey)) {
      clone[key] = "[REDACTED]";
    } else if (keysToMask[key]) {
      clone[key] = keysToMask[key](val);
    } else if (val && typeof val === "object") {
      clone[key] = redactSensitiveData(val);
    } else {
      clone[key] = val;
    }
  }

  return clone;
}

function writeLog(level, message, correlationId, extra = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    correlationId: correlationId || undefined,
    ...redactSensitiveData(extra)
  };

  const logStr = JSON.stringify(logEntry);
  if (level === "ERROR" || level === "CRITICAL") {
    process.stderr.write(logStr + "\n");
  } else {
    process.stdout.write(logStr + "\n");
  }
}

const logger = {
  info: (message, context = {}, correlationId = null) => {
    writeLog("INFO", message, correlationId, { context });
  },
  warn: (message, context = {}, correlationId = null) => {
    writeLog("WARN", message, correlationId, { context });
  },
  error: (message, err = null, context = {}, correlationId = null) => {
    const errorDetails = err ? redactSensitiveData(err) : undefined;
    writeLog("ERROR", message, correlationId, { context, error: errorDetails });
  },
  critical: (message, err = null, context = {}, correlationId = null) => {
    const errorDetails = err ? redactSensitiveData(err) : undefined;
    writeLog("CRITICAL", message, correlationId, { context, error: errorDetails });
  }
};

module.exports = logger;
