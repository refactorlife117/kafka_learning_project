/**
 * Bootstraps the first admin account (registration always creates 'member').
 *
 *   npm run create-admin -w member-service -- admin@gym.com 'StrongPass123' Ada Admin
 *
 * The member.registered event lands in the outbox and is published to Kafka
 * the next time the service is running — a nice demo of the outbox pattern.
 */
const authService = require('../services/auth.service');
const { registerSchema } = require('../validators/auth.validator');
const pool = require('../db/pool');
const logger = require('../config/logger');

async function main() {
  const [email, password, firstName = 'Gym', lastName = 'Admin'] = process.argv.slice(2);
  const input = registerSchema.parse({ email, password, firstName, lastName });

  const { member } = await authService.register(input, { role: 'admin' });
  logger.info({ id: member.id, email: member.email }, 'Admin account created');
}

main()
  .catch((err) => {
    logger.error({ err }, 'Could not create admin');
    process.exitCode = 1;
  })
  .finally(() => pool.end());
