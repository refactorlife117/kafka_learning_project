/**
 * Creates every Kafka topic (and its DLQ) used by the platform.
 * Services also do this on startup; this script is handy to inspect or
 * prepare a fresh cluster:   npm run kafka:topics
 */
const {
  createKafkaClient,
  createLogger,
  ensureTopics,
  listEnv,
  intEnv,
  ALL_TOPICS,
} = require('@fitness/common');

const logger = createLogger('create-topics');
const kafka = createKafkaClient({
  clientId: 'topic-admin',
  brokers: listEnv('KAFKA_BROKERS', ['localhost:9092']),
  logger,
});

async function main() {
  await ensureTopics({
    kafka,
    replicationFactor: intEnv('KAFKA_REPLICATION_FACTOR', 1),
    logger,
  });

  const admin = kafka.admin();
  await admin.connect();
  const { topics } = await admin.fetchTopicMetadata({ topics: ALL_TOPICS });
  await admin.disconnect();

  for (const { name, partitions } of topics) {
    logger.info(`${name.padEnd(32)} partitions=${partitions.length}`);
  }
}

main().catch((err) => {
  logger.error({ err }, 'Failed to create topics');
  process.exitCode = 1;
});
