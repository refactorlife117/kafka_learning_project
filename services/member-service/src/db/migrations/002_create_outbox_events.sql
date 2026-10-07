-- Transactional outbox: events are written here in the same transaction as the
-- business change, then relayed to Kafka by the outbox relay.
CREATE TABLE IF NOT EXISTS outbox_events (
  id           UUID        PRIMARY KEY,           -- = eventId in the envelope
  seq          BIGSERIAL   NOT NULL UNIQUE,       -- preserves insertion order
  topic        TEXT        NOT NULL,
  message_key  TEXT        NOT NULL,
  event_type   TEXT        NOT NULL,
  payload      JSONB       NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_outbox_events_unpublished
  ON outbox_events (seq) WHERE published_at IS NULL;
