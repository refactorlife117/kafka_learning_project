const { createBaseApp, notFoundHandler, errorHandler } = require('@fitness/common');
const logger = require('./config/logger');
const pool = require('./db/pool');
const routes = require('./routes');

function createApp() {
  const app = createBaseApp({ logger, healthCheck: () => pool.query('SELECT 1') });

  app.use(routes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
