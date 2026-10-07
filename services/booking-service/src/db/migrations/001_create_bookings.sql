-- Read models: local copies of data owned by other services, kept up to date
-- from Kafka events. They let this service validate bookings without making
-- synchronous HTTP calls to member-service / class-service.
CREATE TABLE IF NOT EXISTS member_snapshots (
  id              UUID PRIMARY KEY,            -- = member id
  email           TEXT        NOT NULL,
  first_name      TEXT        NOT NULL,
  last_name       TEXT        NOT NULL,
  membership_plan TEXT        NOT NULL,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS class_snapshots (
  id               UUID PRIMARY KEY,           -- = class id
  title            TEXT        NOT NULL,
  category         TEXT        NOT NULL,
  trainer_name     TEXT,
  starts_at        TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER     NOT NULL,
  capacity         INTEGER     NOT NULL,
  status           TEXT        NOT NULL,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Data owned by this service
CREATE TABLE IF NOT EXISTS bookings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id           UUID        NOT NULL REFERENCES member_snapshots (id),
  class_id            UUID        NOT NULL REFERENCES class_snapshots (id),
  status              TEXT        NOT NULL DEFAULT 'confirmed'
                      CHECK (status IN ('confirmed', 'cancelled')),
  cancellation_reason TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at        TIMESTAMPTZ
);

-- A member can hold at most one active booking per class
CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_member_class_confirmed
  ON bookings (member_id, class_id) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_bookings_class_id ON bookings (class_id);
CREATE INDEX IF NOT EXISTS idx_bookings_member_id ON bookings (member_id);
