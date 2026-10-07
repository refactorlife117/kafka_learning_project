const {
  ensureTopics,
  createProducer,
  startOutboxRelay,
  registerShutdown,
} = require('@fitness/common');
const config = require('./config');
const logger = require('./config/logger');
const pool = require('./db/pool');
const { migrate } = require('./db/migrate');
const kafka = require('./events/kafka');
const { createApp } = require('./app');

async function bootstrap() {
  await pool.query('SELECT 1');
  logger.info('Connected to PostgreSQL');

  if (config.db.migrateOnStart) await migrate();

  await ensureTopics({ kafka, replicationFactor: config.kafka.replicationFactor, logger });
  const producer = await createProducer(kafka);
  const outboxRelay = startOutboxRelay({
    pool,
    producer,
    logger,
    intervalMs: config.outbox.pollIntervalMs,
  });

  const server = createApp().listen(config.port, () => {
    logger.info(`${config.serviceName} listening on http://localhost:${config.port}`);
  });

  registerShutdown({
    logger,
    tasks: [
      () => new Promise((resolve) => server.close(resolve)),
      () => outboxRelay.stop(),
      () => producer.disconnect(),
      () => pool.end(),
    ],
  });
}

bootstrap().catch((err) => {
  logger.fatal({ err }, 'Failed to start service');
  process.exit(1);
});
