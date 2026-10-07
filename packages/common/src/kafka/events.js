const { randomUUID } = require('node:crypto');

/**
 * Standard envelope for every event on the bus:
 *
 * {
 *   eventId:      "uuid",                 // unique; consumers use it for de-duplication
 *   eventType:    "booking.confirmed",
 *   eventVersion: 1,                      // bump when the shape of `data` changes
 *   source:       "booking-service",
 *   occurredAt:   "2026-01-01T10:00:00.000Z",
 *   data:         { ...domain payload }
 * }
 */
function createEvent({ type, source, data, version = 1 }) {
  return {
    eventId: randomUUID(),
    eventType: type,
    eventVersion: version,
    source,
    occurredAt: new Date().toISOString(),
    data,
  };
}

module.exports = { createEvent };
