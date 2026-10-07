const path = require('node:path');
const { runMigrations } = require('@fitness/common');
const pool = require('./pool');
const logger = require('../config/logger');

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

async function migrate() {
  await runMigrations({ pool, migrationsDir: MIGRATIONS_DIR, logger });
}

// Allow running directly: `npm run migrate`
if (require.main === module) {
  migrate()
    .then(() => pool.end())
    .catch(async (err) => {
      logger.fatal({ err }, 'Migration failed');
      await pool.end();
      process.exitCode = 1;
    });
}

module.exports = { migrate };
