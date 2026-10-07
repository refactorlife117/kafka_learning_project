const pino = require('pino');

function createLogger(serviceName) {
  const isProduction = process.env.NODE_ENV === 'production';

  return pino({
    level: process.env.LOG_LEVEL || 'info',
    base: { service: serviceName },
    redact: ['req.headers.authorization', '*.password', '*.passwordHash'],
    // Human-readable logs locally, structured JSON in production
    transport: isProduction
      ? undefined
      : {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss',
            ignore: 'pid,hostname,service',
          },
        },
  });
}

module.exports = { createLogger };
