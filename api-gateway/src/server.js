const { registerShutdown } = require('@fitness/common');
const config = require('./config');
const logger = require('./config/logger');
const { createApp } = require('./app');

const server = createApp().listen(config.port, () => {
  logger.info(`${config.serviceName} listening on http://localhost:${config.port}`);
  logger.info({ services: config.services }, 'Routing to services');
});

registerShutdown({
  logger,
  tasks: [() => new Promise((resolve) => server.close(resolve))],
});
