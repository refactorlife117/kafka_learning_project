const { EVENT_TYPES } = require('@fitness/common');
const classSnapshotRepository = require('../../repositories/class-snapshot.repository');
const bookingRepository = require('../../repositories/booking.repository');
const bookingPublisher = require('../publishers/booking.publisher');
const { CANCELLATION_REASONS } = require('../../constants');

async function onClassScheduled(event, { client }) {
  const { classId, title, category, trainerName, startsAt, durationMinutes, capacity } = event.data;
  await classSnapshotRepository.upsert(
    {
      id: classId,
      title,
      category,
      trainerName,
      startsAt,
      durationMinutes,
      capacity,
      status: 'scheduled',
    },
    client,
  );
}

/**
 * CHOREOGRAPHY example: class-service doesn't call us — it just announces
 * "class.cancelled". We react by cancelling every booking for that class and
 * announcing a booking.cancelled event for each (which class-service in turn
 * consumes to reset its booked_count). All in one transaction.
 */
async function onClassCancelled(event, { client, logger }) {
  const { classId } = event.data;
  await classSnapshotRepository.updateStatus(classId, 'cancelled', client);

  const reason = CANCELLATION_REASONS.CLASS_CANCELLED;
  const cancelled = await bookingRepository.cancelAllForClass(classId, reason, client);
  for (const booking of cancelled) {
    await bookingPublisher.bookingCancelled(client, booking, reason);
  }
  logger.info(
    { classId, cancelledBookings: cancelled.length },
    'Cancelled bookings for cancelled class',
  );
}

module.exports = {
  [EVENT_TYPES.CLASS_SCHEDULED]: onClassScheduled,
  [EVENT_TYPES.CLASS_CANCELLED]: onClassCancelled,
};
