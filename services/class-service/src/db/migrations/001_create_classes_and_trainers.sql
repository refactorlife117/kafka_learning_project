-- Read model of trainers, built from member events (member-service is the owner).
CREATE TABLE IF NOT EXISTS trainers (
  id         UUID PRIMARY KEY,                 -- = member id
  email      TEXT        NOT NULL,
  first_name TEXT        NOT NULL,
  last_name  TEXT        NOT NULL,
  active     BOOLEAN     NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS gym_classes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT        NOT NULL,
  description         TEXT,
  category            TEXT        NOT NULL
                      CHECK (category IN ('yoga', 'hiit', 'strength', 'cardio', 'pilates', 'spin', 'boxing', 'crossfit')),
  trainer_id          UUID        NOT NULL REFERENCES trainers (id),
  room                TEXT,
  starts_at           TIMESTAMPTZ NOT NULL,
  duration_minutes    INTEGER     NOT NULL CHECK (duration_minutes BETWEEN 15 AND 240),
  capacity            INTEGER     NOT NULL CHECK (capacity > 0),
  -- Projection maintained from booking events; booking-service owns the truth
  booked_count        INTEGER     NOT NULL DEFAULT 0 CHECK (booked_count >= 0),
  status              TEXT        NOT NULL DEFAULT 'scheduled'
                      CHECK (status IN ('scheduled', 'cancelled')),
  cancellation_reason TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gym_classes_starts_at ON gym_classes (starts_at);
CREATE INDEX IF NOT EXISTS idx_gym_classes_trainer_id ON gym_classes (trainer_id);
