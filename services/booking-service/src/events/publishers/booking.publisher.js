const { createEvent, enqueueEvent, TOPICS, EVENT_TYPES } = require('@fitness/common');
const config = require('../../config');

// Keyed by booking id: confirmed -> cancelled for the same booking stay in order
const enqueue = (client, type, bookingId, data) =>
  enqueueEvent(client, {
    topic: TOPICS.BOOKING_EVENTS,
    key: bookingId,
    event: createEvent({ type, source: config.serviceName, data }),
  });

function bookingConfirmed(client, booking) {
  return enqueue(client, EVENT_TYPES.BOOKING_CONFIRMED, booking.id, {
    bookingId: booking.id,
    memberId: booking.member.id,
    classId: booking.class.id,
    classStartsAt: booking.class.startsAt,
  });
}

function bookingCancelled(client, { id, memberId, classId }, reason) {
  return enqueue(client, EVENT_TYPES.BOOKING_CANCELLED, id, {
    bookingId: id,
    memberId,
    classId,
    reason,
  });
}

module.exports = { bookingConfirmed, bookingCancelled };
