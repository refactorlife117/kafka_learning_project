const { withTransaction } = require('../db/pool');
const { sleep } = require('../lifecycle');

/**
 * TRANSACTIONAL OUTBOX PATTERN
 * ----------------------------
 * Problem: "save to DB, then publish to Kafka" is not atomic. If the process
 * crashes between the two, the DB says a booking exists but nobody is told.
 *
 * Solution: in the SAME DB transaction as the business change, insert the
 * event into an `outbox_events` table (enqueueEvent). A background relay
 * (startOutboxRelay) then reads unpublished rows, sends them to Kafka and
 * marks them published. Result: the event is published if and only if the
 * business change was committed (at-least-once delivery — consumers dedupe).
 */

async function enqueueEvent(client, { topic, key, event }) {
  await client.query(
    `INSERT INTO outbox_events (id, topic, message_key, event_type, payload)
     VALUES ($1, $2, $3, $4, $5)`,
    [event.eventId, topic, String(key), event.eventType, event],
  );
}

function toKafkaMessage(row) {
  return {
    key: row.message_key,
    value: JSON.stringify(row.payload),
    headers: { 'event-id': row.id, 'event-type': row.event_type },
  };
}

function startOutboxRelay({ pool, producer, logger, intervalMs = 1000, batchSize = 100 }) {
  let running = false;
  let stopped = false;

  const publishBatch = () =>
    withTransaction(pool, async (client) => {
      // SKIP LOCKED lets several service instances run the relay without
      // picking up the same rows.
      const { rows } = await client.query(
        `SELECT id, topic, message_key, event_type, payload
           FROM outbox_events
          WHERE published_at IS NULL
          ORDER BY seq
          LIMIT $1
          FOR UPDATE SKIP LOCKED`,
        [batchSize],
      );
      if (rows.length === 0) return 0;

      const messagesByTopic = new Map();
      for (const row of rows) {
        if (!messagesByTopic.has(row.topic)) messagesByTopic.set(row.topic, []);
        messagesByTopic.get(row.topic).push(toKafkaMessage(row));
      }

      await producer.sendBatch({
        topicMessages: [...messagesByTopic].map(([topic, messages]) => ({ topic, messages })),
      });

      await client.query(
        'UPDATE outbox_events SET published_at = now() WHERE id = ANY($1::uuid[])',
        [rows.map((row) => row.id)],
      );

      for (const row of rows) {
        logger.info(
          { topic: row.topic, eventType: row.event_type, eventId: row.id },
          'Published event',
        );
      }
      return rows.length;
    });

  const tick = async () => {
    if (running || stopped) return;
    running = true;
    try {
      let published;
      do {
        published = await publishBatch();
      } while (published === batchSize && !stopped);
    } catch (err) {
      logger.error({ err }, 'Outbox relay failed, will retry on next tick');
    } finally {
      running = false;
    }
  };

  const timer = setInterval(tick, intervalMs);
  logger.info({ intervalMs }, 'Outbox relay started');

  return {
    async stop() {
      stopped = true;
      clearInterval(timer);
      while (running) await sleep(50);
    },
  };
}

module.exports = { enqueueEvent, startOutboxRelay };
