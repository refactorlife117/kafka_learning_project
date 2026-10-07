const fs = require('node:fs/promises');
const path = require('node:path');
const { withTransaction } = require('./pool');

// Arbitrary constant: an advisory lock stops two instances migrating at the same time
const MIGRATION_LOCK_ID = 727_001;

/**
 * Minimal forward-only SQL migration runner. Applies every `*.sql` file in
 * `migrationsDir` (sorted by name, e.g. 001_xxx.sql, 002_xxx.sql) that is not
 * yet recorded in the `schema_migrations` table, each in its own transaction.
 */
async function runMigrations({ pool, migrationsDir, logger }) {
  const lockClient = await pool.connect();
  try {
    await lockClient.query('SELECT pg_advisory_lock($1)', [MIGRATION_LOCK_ID]);
    await lockClient.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name       TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await lockClient.query('SELECT name FROM schema_migrations');
    const applied = new Set(rows.map((row) => row.name));
    const files = (await fs.readdir(migrationsDir)).filter((f) => f.endsWith('.sql')).sort();
    const pending = files.filter((file) => !applied.has(file));

    for (const file of pending) {
      const sql = await fs.readFile(path.join(migrationsDir, file), 'utf8');
      await withTransaction(pool, async (client) => {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
      });
      logger.info({ migration: file }, 'Applied migration');
    }

    if (pending.length === 0) logger.info('Database schema is up to date');
  } finally {
    await lockClient.query('SELECT pg_advisory_unlock($1)', [MIGRATION_LOCK_ID]).catch(() => {});
    lockClient.release();
  }
}

module.exports = { runMigrations };
