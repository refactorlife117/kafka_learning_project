const { Kafka, Partitioners, logLevel } = require('kafkajs');

const PINO_LEVEL = {
  [logLevel.ERROR]: 'error',
  [logLevel.WARN]: 'warn',
  [logLevel.INFO]: 'info',
  [logLevel.DEBUG]: 'debug',
};

/** Routes kafkajs' internal logs through our pino logger. */
const pinoLogCreator = (logger) => () => {
  return ({ namespace, level, log }) => {
    const { message, ...extra } = log;
    const method = PINO_LEVEL[level] || 'info';
    logger[method]({ kafka: namespace, ...extra }, message);
  };
};

function createKafkaClient({ clientId, brokers, logger }) {
  return new Kafka({
    clientId,
    brokers,
    logLevel: logLevel.WARN,
    logCreator: pinoLogCreator(logger),
    retry: { initialRetryTime: 300, retries: 10 },
  });
}

/**
 * Idempotent producer: the broker de-duplicates retried sends, so a network
 * blip never writes the same message twice to a partition.
 * Messages with the same key always go to the same partition, which is what
 * gives us per-entity ordering (e.g. all events of one booking stay in order).
 */
async function createProducer(kafka) {
  const producer = kafka.producer({
    idempotent: true,
    maxInFlightRequests: 1,
    // Idempotence requires never giving up on a send; the outbox keeps the event safe meanwhile
    retry: { retries: Number.MAX_SAFE_INTEGER },
    createPartitioner: Partitioners.DefaultPartitioner,
  });
  await producer.connect();
  return producer;
}

module.exports = { createKafkaClient, createProducer };
