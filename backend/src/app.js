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
const requestCorrelation = require("./middleware/requestCorrelation");

const app = express();

// Disable x-powered-by header (OWASP ASVS / Information Disclosure prevention)
app.disable("x-powered-by");

// Enforce production mode internally in Express when configured
if (env.nodeEnv === "production") {
  app.set("env", "production");
}

app.set("trust proxy", 1);

// 1. Request Correlation ID middleware (MUST be first to trace the request cycle)
app.use(requestCorrelation);

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

// 2. Helmet & CORS middleware (MUST be first so error responses also get CORS headers)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https://*.supabase.co"],
        connectSrc: ["'self'"],
        upgradeInsecureRequests: [],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameguard: {
      action: "deny"
    },
    contentTypeNosniff: true,
    referrerPolicy: {
      policy: "strict-origin-when-cross-origin"
    }
  })
);

// Manual backup for security headers & Permissions-Policy
app.use((req, res, next) => {
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  next();
});

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

// 3. Cookie parser (needed for CSRF cookie parsing)
app.use(cookieParser());

// 4. CSRF Protection (registered after CORS and cookies)
const csrfProtection = csrf({
  cookie: {
    key: "_csrf",
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: "lax" // Lax allows cross-origin cookie inclusion under local dev port splits
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

// Sanitized health check (no service names or host leaks)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
