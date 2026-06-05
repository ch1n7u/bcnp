const crypto = require("crypto");

function requestCorrelation(req, res, next) {
  let correlationId = req.headers["x-correlation-id"];

  // Validate incoming correlation ID or generate a new secure UUID v4
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!correlationId || !uuidRegex.test(correlationId)) {
    correlationId = crypto.randomUUID();
  }

  req.correlationId = correlationId;
  res.setHeader("X-Correlation-ID", correlationId);
  next();
}

module.exports = requestCorrelation;
