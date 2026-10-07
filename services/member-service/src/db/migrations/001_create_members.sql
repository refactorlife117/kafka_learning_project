CREATE TABLE IF NOT EXISTS members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email           TEXT        NOT NULL,
  password_hash   TEXT        NOT NULL,
  first_name      TEXT        NOT NULL,
  last_name       TEXT        NOT NULL,
  phone           TEXT,
  role            TEXT        NOT NULL DEFAULT 'member'
                  CHECK (role IN ('member', 'trainer', 'admin')),
  membership_plan TEXT        NOT NULL DEFAULT 'basic'
                  CHECK (membership_plan IN ('basic', 'premium', 'elite')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_members_email ON members (lower(email));
