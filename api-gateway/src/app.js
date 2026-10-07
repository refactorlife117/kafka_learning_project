const { randomUUID } = require('node:crypto');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const pinoHttp = require('pino-http');
const { notFoundHandler, errorHandler } = require('@fitness/common');
const config = require('./config');
const logger = require('./config/logger');
const { globalLimiter } = require('./middlewares/rate-limiter');
const healthRoutes = require('./routes/health.routes');
const { createProxyRouter } = require('./routes/proxy.routes');

function createApp() {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1); // correct client IPs for rate limiting behind a load balancer
  app.use(helmet());
  app.use(cors({ origin: config.corsOrigins.includes('*') ? '*' : config.corsOrigins }));
  app.use(
    pinoHttp({
      logger,
      // Generate a request id at the edge and pass it to every service for tracing
      genReqId: (req, res) => {
        const id = req.headers['x-request-id'] || randomUUID();
        req.headers['x-request-id'] = id;
        res.setHeader('x-request-id', id);
        return id;
      },
      autoLogging: { ignore: (req) => req.url.startsWith('/health') },
    }),
  );

  app.use(healthRoutes);
  app.use(globalLimiter);

  // NOTE: no express.json() here — the gateway streams bodies straight to the
  // services; parsing them first would consume the stream.
  app.use(createProxyRouter());

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
