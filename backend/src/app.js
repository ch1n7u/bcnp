const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const hpp = require("hpp");
const rateLimit = require("express-rate-limit");
const cookieParser = require("cookie-parser");
const routes = require("./routes");
const env = require("./config/env");
const { notFound, errorHandler } = require("./middleware/errorHandler");

const app = express();
app.use(cookieParser());
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

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
