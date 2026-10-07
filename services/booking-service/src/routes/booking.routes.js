const { Router } = require('express');
const { validate, authenticate, authorize } = require('@fitness/common');
const controller = require('../controllers/booking.controller');
const {
  bookingIdParams,
  createBookingSchema,
  myBookingsQuery,
  listBookingsQuery,
} = require('../validators/booking.validator');

const router = Router();

router.use(authenticate);

router.post('/', validate({ body: createBookingSchema }), controller.create);
router.get('/me', validate({ query: myBookingsQuery }), controller.listMine);

// Rosters for staff, e.g. GET /bookings?classId=...&status=confirmed
router.get(
  '/',
  authorize('trainer', 'admin'),
  validate({ query: listBookingsQuery }),
  controller.list,
);

router.get('/:id', validate({ params: bookingIdParams }), controller.getById);
router.patch('/:id/cancel', validate({ params: bookingIdParams }), controller.cancel);

module.exports = router;
