const { rateLimit } = require('express-rate-limit');
const config = require('../config');

const createLimiter = (limit) =>
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    handler: (_req, res) =>
      res.status(429).json({
        error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please slow down' },
      }),
  });

/** Applies to every request. */
const globalLimiter = createLimiter(config.rateLimit.max);

/** Tighter limit for login/register to slow down brute-force attempts. */
const authLimiter = createLimiter(config.rateLimit.authMax);

module.exports = { globalLimiter, authLimiter };
