/**
 * Operational errors that map cleanly to HTTP responses. Anything that is not
 * an AppError is treated as an unexpected 500 by the error handler.
 */
class AppError extends Error {
  constructor(message, { statusCode = 500, code = 'INTERNAL_ERROR', details } = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

class BadRequestError extends AppError {
  constructor(message = 'Bad request', details) {
    super(message, { statusCode: 400, code: 'BAD_REQUEST', details });
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed', details) {
    super(message, { statusCode: 400, code: 'VALIDATION_ERROR', details });
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, { statusCode: 401, code: 'UNAUTHORIZED' });
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, { statusCode: 403, code: 'FORBIDDEN' });
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, { statusCode: 404, code: 'NOT_FOUND' });
  }
}

class ConflictError extends AppError {
  constructor(message = 'Resource conflict', details) {
    super(message, { statusCode: 409, code: 'CONFLICT', details });
  }
}

module.exports = {
  AppError,
  BadRequestError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
};
