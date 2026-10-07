const path = require('node:path');
const { loadEnv, requireEnv, optionalEnv, intEnv, listEnv } = require('@fitness/common');

loadEnv(path.resolve(__dirname, '../..'));

const config = {
  serviceName: 'api-gateway',
  env: optionalEnv('NODE_ENV', 'development'),
  port: intEnv('PORT', 3000),
  jwtSecret: requireEnv('JWT_SECRET'),
  services: {
    member: optionalEnv('MEMBER_SERVICE_URL', 'http://localhost:3001'),
    class: optionalEnv('CLASS_SERVICE_URL', 'http://localhost:3002'),
    booking: optionalEnv('BOOKING_SERVICE_URL', 'http://localhost:3003'),
  },
  corsOrigins: listEnv('CORS_ORIGINS', ['*']),
  rateLimit: {
    windowMs: intEnv('RATE_LIMIT_WINDOW_MS', 60_000),
    max: intEnv('RATE_LIMIT_MAX', 300),
    authMax: intEnv('AUTH_RATE_LIMIT_MAX', 20),
  },
  proxyTimeoutMs: intEnv('PROXY_TIMEOUT_MS', 10_000),
};

module.exports = Object.freeze(config);
