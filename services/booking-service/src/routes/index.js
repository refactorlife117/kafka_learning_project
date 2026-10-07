const { Router } = require('express');
const bookingRoutes = require('./booking.routes');

const router = Router();

router.use('/bookings', bookingRoutes);

module.exports = router;
