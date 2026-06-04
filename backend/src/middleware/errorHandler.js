function notFound(req, res) {
  return res.status(404).json({ message: "Route not found" });
}

function errorHandler(err, req, res, next) {
  if (err.code === "EBADCSRFTOKEN") {
    return res.status(403).json({ message: "Invalid or missing CSRF token" });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal server error";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  return res.status(statusCode).json({ message });
}

module.exports = {
  notFound,
  errorHandler
};
