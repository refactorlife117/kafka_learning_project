const CLASS_CATEGORIES = Object.freeze([
  'yoga',
  'hiit',
  'strength',
  'cardio',
  'pilates',
  'spin',
  'boxing',
  'crossfit',
]);

const CLASS_STATUS = Object.freeze({
  SCHEDULED: 'scheduled',
  CANCELLED: 'cancelled',
});

module.exports = { CLASS_CATEGORIES, CLASS_STATUS };
