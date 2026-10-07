const { Pool } = require('pg');

/**
 * Creates a PostgreSQL connection pool. For hosted databases that require TLS
 * (Neon, Supabase, RDS...) add `?sslmode=require` to the DATABASE_URL.
 */
function createPool({ connectionString, max = 10, logger }) {
  const pool = new Pool({ connectionString, max });
  pool.on('error', (err) => logger.error({ err }, 'Unexpected error on idle PostgreSQL client'));
  return pool;
}

/**
 * Runs `work(client)` inside a single transaction. Everything written through
 * `client` is committed together or rolled back together.
 */
async function withTransaction(pool, work) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { createPool, withTransaction };
