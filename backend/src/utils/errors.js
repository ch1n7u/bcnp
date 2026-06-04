class BaseError extends Error {
  constructor(message, statusCode, isOperational = true) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ApiError extends BaseError {
  constructor(message = "Unable to process your request.", statusCode = 400) {
    super(message, statusCode, true);
  }
}

class ValidationError extends BaseError {
  constructor(errors = [], message = "Unable to process your request.") {
    super(message, 400, true);
    this.errors = errors;
  }
}

class AuthenticationError extends BaseError {
  constructor(message = "Invalid credentials.") {
    super(message, 401, true);
  }
}

class ForbiddenError extends BaseError {
  constructor(message = "Forbidden.") {
    super(message, 403, true);
  }
}

class NotFoundError extends BaseError {
  constructor(message = "Unable to process your request.") {
    super(message, 404, true);
  }
}

class RateLimitError extends BaseError {
  constructor(message = "Unable to process your request.") {
    super(message, 429, true);
  }
}

class InternalError extends BaseError {
  constructor(message = "An unexpected error occurred. Please try again later.") {
    super(message, 500, false);
  }
}

module.exports = {
  BaseError,
  ApiError,
  ValidationError,
  AuthenticationError,
  ForbiddenError,
  NotFoundError,
  RateLimitError,
  InternalError
};
