const { EVENT_TYPES } = require('@fitness/common');
const classRepository = require('../../repositories/class.repository');

/** Keeps `booked_count` on each class in sync with booking-service. */
const adjustBookedCount = (delta) =>
  async function onBookingChanged(event, { client, logger }) {
    const { classId } = event.data;
    const updated = await classRepository.adjustBookedCount(classId, delta, client);
    if (!updated) logger.warn({ classId }, 'Booking event for unknown class ignored');
  };

module.exports = {
  [EVENT_TYPES.BOOKING_CONFIRMED]: adjustBookedCount(+1),
  [EVENT_TYPES.BOOKING_CANCELLED]: adjustBookedCount(-1),
};
