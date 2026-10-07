-- Idempotent consumer ("inbox"): ids of events already handled, so redelivered
-- Kafka messages are not applied twice.
CREATE TABLE IF NOT EXISTS processed_events (
  event_id     UUID        PRIMARY KEY,
  event_type   TEXT        NOT NULL,
  topic        TEXT        NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
