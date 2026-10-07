const { withTransaction } = require('../db/pool');
const { sleep } = require('../lifecycle');
const { dlqTopicFor } = require('./topics');

/**
 * Starts a consumer in `groupId` that dispatches each event to
 * `handlers[event.eventType]`.
 *
 * Guarantees provided here:
 *  - IDEMPOTENCY: Kafka delivers at-least-once, so the same event can arrive
 *    twice. The event id is recorded in `processed_events` in the same DB
 *    transaction as the handler's writes; duplicates are skipped.
 *  - RETRIES: a failing handler is retried with exponential backoff.
 *  - DEAD LETTER QUEUE: after `maxAttempts`, the message is parked on
 *    `<topic>.dlq` so one bad message cannot block the partition forever.
 *
 * Handlers receive `(event, { client, logger })` where `client` is the open
 * transaction — they can also call enqueueEvent(client, ...) to publish
 * follow-up events atomically.
 */
async function startConsumer({
  kafka,
  groupId,
  topics,
  handlers,
  pool,
  producer,
  logger,
  maxAttempts = 3,
}) {
  const consumer = kafka.consumer({ groupId });
  await consumer.connect();
  // fromBeginning only applies the first time this group starts (no committed offset yet)
  await consumer.subscribe({ topics, fromBeginning: true });

  const sendToDlq = async ({ topic, partition, message }, reason) => {
    await producer.send({
      topic: dlqTopicFor(topic),
      messages: [
        {
          key: message.key,
          value: message.value,
          headers: {
            ...message.headers,
            'dlq-reason': reason,
            'dlq-original-topic': topic,
            'dlq-original-partition': String(partition),
            'dlq-original-offset': message.offset,
            'dlq-consumer-group': groupId,
          },
        },
      ],
    });
  };

  const processEvent = (event, topic, log) =>
    withTransaction(pool, async (client) => {
      const { rowCount } = await client.query(
        `INSERT INTO processed_events (event_id, event_type, topic)
         VALUES ($1, $2, $3)
         ON CONFLICT (event_id) DO NOTHING`,
        [event.eventId, event.eventType, topic],
      );
      if (rowCount === 0) return false; // already handled earlier

      await handlers[event.eventType](event, { client, logger: log });
      return true;
    });

  await consumer.run({
    // Offsets are committed automatically after eachMessage resolves.
    eachMessage: async (payload) => {
      const { topic, partition, message } = payload;
      const log = logger.child({ topic, partition, offset: message.offset });

      let event;
      try {
        event = JSON.parse(message.value.toString());
      } catch {
        log.error('Malformed message, moving to DLQ');
        await sendToDlq(payload, 'malformed-json');
        return;
      }

      if (!handlers[event.eventType]) {
        log.debug({ eventType: event.eventType }, 'No handler for event type, skipping');
        return;
      }

      const eventLog = log.child({ eventType: event.eventType, eventId: event.eventId });
      for (let attempt = 1; ; attempt += 1) {
        try {
          const processed = await processEvent(event, topic, eventLog);
          eventLog.info(processed ? 'Event handled' : 'Duplicate event ignored');
          return;
        } catch (err) {
          if (attempt >= maxAttempts) {
            eventLog.error({ err, attempt }, 'Event failed permanently, moving to DLQ');
            await sendToDlq(payload, err.message);
            return;
          }
          const backoffMs = 2 ** attempt * 250;
          eventLog.warn({ err, attempt, backoffMs }, 'Event handler failed, retrying');
          await sleep(backoffMs);
        }
      }
    },
  });

  logger.info({ groupId, topics }, 'Kafka consumer started');
  return consumer;
}

module.exports = { startConsumer };
