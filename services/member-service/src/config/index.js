const path = require('node:path');
const { loadEnv, requireEnv, optionalEnv, intEnv, boolEnv, listEnv } = require('@fitness/common');

loadEnv(path.resolve(__dirname, '../..'));

const config = {
  serviceName: 'member-service',
  env: optionalEnv('NODE_ENV', 'development'),
  port: intEnv('PORT', 3001),
  db: {
    url: requireEnv('DATABASE_URL'),
    migrateOnStart: boolEnv('DB_MIGRATE_ON_START', true),
  },
  jwt: {
    secret: requireEnv('JWT_SECRET'),
    expiresIn: optionalEnv('JWT_EXPIRES_IN', '1d'),
  },
  kafka: {
    clientId: optionalEnv('KAFKA_CLIENT_ID', 'member-service'),
    brokers: listEnv('KAFKA_BROKERS', ['localhost:9092']),
    replicationFactor: intEnv('KAFKA_REPLICATION_FACTOR', 1),
  },
  outbox: {
    pollIntervalMs: intEnv('OUTBOX_POLL_INTERVAL_MS', 1000),
  },
};

module.exports = Object.freeze(config);
