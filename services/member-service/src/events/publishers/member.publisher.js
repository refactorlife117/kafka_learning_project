const { createEvent, enqueueEvent, TOPICS, EVENT_TYPES } = require('@fitness/common');
const config = require('../../config');

/**
 * Event-carried state transfer: each event contains the full public snapshot
 * of the member, so consumers can keep their own local copy without calling
 * this service over HTTP.
 * Never put secrets (password hash) in events.
 */
const toEventData = (member) => ({
  memberId: member.id,
  email: member.email,
  firstName: member.firstName,
  lastName: member.lastName,
  role: member.role,
  membershipPlan: member.membershipPlan,
});

const enqueue = (client, type, member) =>
  enqueueEvent(client, {
    topic: TOPICS.MEMBER_EVENTS,
    key: member.id, // same key => same partition => ordered per member
    event: createEvent({ type, source: config.serviceName, data: toEventData(member) }),
  });

module.exports = {
  memberRegistered: (client, member) => enqueue(client, EVENT_TYPES.MEMBER_REGISTERED, member),
  memberUpdated: (client, member) => enqueue(client, EVENT_TYPES.MEMBER_UPDATED, member),
};
