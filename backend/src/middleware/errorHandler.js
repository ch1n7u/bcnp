const logger = require("../utils/logger");
const { BaseError } = require("../utils/errors");

function notFound(req, res) {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`, {}, req.correlationId);
  return res.status(404).json({
    status: "error",
    message: "Unable to process your request.",
    correlationId: req.correlationId
  });
}

function errorHandler(err, req, res, next) {
  const correlationId = req.correlationId;

  if (err.code === "EBADCSRFTOKEN") {
    logger.warn("CSRF token validation failed", { path: req.path }, correlationId);
    return res.status(403).json({
      status: "error",
      message: "Unable to process your request.",
      correlationId
    });
  }

  const isOperational = err instanceof BaseError ? err.isOperational : false;
  const statusCode = err.statusCode || 500;

  // By default, hide internal server errors with a generic message
  let clientMessage = "An unexpected error occurred. Please try again later.";
  if (isOperational) {
    clientMessage = err.message;
  }

  // Force generic message for any database, file, system paths, or credential-revealing messages
  const sensitivePatterns = [
    /postgres/i, /supabase/i, /sql/i, /database/i, /connection/i,
    /file/i, /path/i, /jwt/i, /secret/i, /token/i, /api/i,
    /hostname/i, /ip/i, /node_modules/i, /C:\\/i, /Users\\/i, /\//
  ];

  if (sensitivePatterns.some(p => p.test(clientMessage)) || statusCode === 500) {
    clientMessage = "An unexpected error occurred. Please try again later.";
  }

  // Securely log details internally
  if (statusCode >= 500 || !isOperational) {
    logger.critical(`Internal Server Error: ${err.message}`, err, { path: req.path, query: req.query }, correlationId);
  } else {
    logger.warn(`Operational Error: ${err.message}`, { path: req.path, statusCode }, correlationId);
  }

  const responseBody = {
    status: "error",
    message: clientMessage,
    correlationId
  };

  if (err.errors) {
    responseBody.errors = err.errors;
  }

  return res.status(statusCode).json(responseBody);
}

module.exports = {
  notFound,
  errorHandler
};
