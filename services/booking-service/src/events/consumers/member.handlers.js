const { EVENT_TYPES } = require('@fitness/common');
const memberSnapshotRepository = require('../../repositories/member-snapshot.repository');

/** Keeps the local member read model (plan, name, email) in sync. */
async function onMemberChanged(event, { client }) {
  const { memberId, email, firstName, lastName, membershipPlan } = event.data;
  await memberSnapshotRepository.upsert(
    { id: memberId, email, firstName, lastName, membershipPlan },
    client,
  );
}

module.exports = {
  [EVENT_TYPES.MEMBER_REGISTERED]: onMemberChanged,
  [EVENT_TYPES.MEMBER_UPDATED]: onMemberChanged,
};
