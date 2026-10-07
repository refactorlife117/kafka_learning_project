/**
 * Topic-per-aggregate design: every event about a member goes to the member
 * topic, keyed by member id. Consumers switch on `eventType` inside the
 * envelope. Keeping all events of one entity in one topic+key guarantees they
 * are consumed in the order they happened (e.g. booking.confirmed before
 * booking.cancelled).
 */
const TOPICS = Object.freeze({
  MEMBER_EVENTS: 'fitness.member.events',
  CLASS_EVENTS: 'fitness.class.events',
  BOOKING_EVENTS: 'fitness.booking.events',
});

const EVENT_TYPES = Object.freeze({
  MEMBER_REGISTERED: 'member.registered',
  MEMBER_UPDATED: 'member.updated',
  CLASS_SCHEDULED: 'class.scheduled',
  CLASS_CANCELLED: 'class.cancelled',
  BOOKING_CONFIRMED: 'booking.confirmed',
  BOOKING_CANCELLED: 'booking.cancelled',
});

/** Dead-letter topic: where messages go after a consumer gives up retrying them. */
const dlqTopicFor = (topic) => `${topic}.dlq`;

const ALL_TOPICS = Object.values(TOPICS).flatMap((topic) => [topic, dlqTopicFor(topic)]);

/**
 * Creates any missing topics. Safe to call on every startup.
 * 3 partitions => up to 3 consumer instances in one group can work in parallel.
 */
async function ensureTopics({
  kafka,
  topics = ALL_TOPICS,
  numPartitions = 3,
  replicationFactor = 1,
  logger,
}) {
  const admin = kafka.admin();
  await admin.connect();
  try {
    const existing = new Set(await admin.listTopics());
    const missing = topics.filter((topic) => !existing.has(topic));
    if (missing.length === 0) return;

    await admin.createTopics({
      waitForLeaders: true,
      topics: missing.map((topic) => ({ topic, numPartitions, replicationFactor })),
    });
    logger.info({ topics: missing }, 'Created Kafka topics');
  } finally {
    await admin.disconnect();
  }
}

module.exports = { TOPICS, EVENT_TYPES, ALL_TOPICS, dlqTopicFor, ensureTopics };
