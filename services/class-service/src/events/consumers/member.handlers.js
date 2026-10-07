const { EVENT_TYPES } = require('@fitness/common');
const trainerRepository = require('../../repositories/trainer.repository');

/**
 * Keeps the local `trainers` read model in sync with member-service.
 * Members who are (or become) trainers are upserted; anyone whose role
 * changes away from trainer is deactivated.
 */
async function onMemberChanged(event, { client, logger }) {
  const { memberId, email, firstName, lastName, role } = event.data;

  if (role === 'trainer') {
    await trainerRepository.upsert({ id: memberId, email, firstName, lastName }, client);
    logger.info({ memberId }, 'Trainer synced');
  } else {
    await trainerRepository.deactivate(memberId, client);
  }
}

module.exports = {
  [EVENT_TYPES.MEMBER_REGISTERED]: onMemberChanged,
  [EVENT_TYPES.MEMBER_UPDATED]: onMemberChanged,
};
