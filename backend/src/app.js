const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const routes = require("./routes");
const env = require("./config/env");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.set("trust proxy", 1);

const localDevOriginPattern = /^https?:\/\/(localhost|127\.0\.0\.1|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/;

function isAllowedOrigin(origin) {
  if (!origin) {
    return env.nodeEnv !== "production";
  }

  if (env.frontendUrls.includes(origin)) {
    return true;
  }

  return env.nodeEnv !== "production" && localDevOriginPattern.test(origin);
}

// 1. Helmet & CORS middleware (MUST be first so error responses also get CORS headers)
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true
  })
);

// 2. Cookie parser (needed for CSRF cookie parsing)
app.use(cookieParser());

// 3. CSRF Protection (registered after CORS and cookies)
const csrfProtection = csrf({
  cookie: {
    key: "_csrf",
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax"
  }
});
app.use(csrfProtection);
app.use(express.json({ limit: "5mb" }));
app.use(hpp());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get("/health", (req, res) => {
  res.json({ status: "ok", service: "cyber-crime-reporting-api" });
});

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
