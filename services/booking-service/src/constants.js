const BOOKING_STATUS = Object.freeze({
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
});

const CANCELLATION_REASONS = Object.freeze({
  MEMBER_CANCELLED: 'member_cancelled',
  CLASS_CANCELLED: 'class_cancelled',
});

/** Max number of upcoming confirmed bookings a member may hold, per plan. */
const PLAN_BOOKING_LIMITS = Object.freeze({
  basic: 2,
  premium: 5,
  elite: Infinity,
});

module.exports = { BOOKING_STATUS, CANCELLATION_REASONS, PLAN_BOOKING_LIMITS };
