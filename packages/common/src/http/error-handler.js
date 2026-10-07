const { AppError, NotFoundError } = require('../errors');

const PG_UNIQUE_VIOLATION = '23505';

function notFoundHandler(req, _res, next) {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}

// Express recognises error handlers by their 4-argument signature
function errorHandler(err, req, res, _next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { code: err.code, message: err.message, details: err.details },
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Malformed JSON body' } });
  }

  if (err.code === PG_UNIQUE_VIOLATION) {
    return res
      .status(409)
      .json({ error: { code: 'CONFLICT', message: 'Resource already exists' } });
  }

  req.log.error({ err }, 'Unhandled error');
  return res
    .status(500)
    .json({ error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' } });
}

module.exports = { notFoundHandler, errorHandler };
