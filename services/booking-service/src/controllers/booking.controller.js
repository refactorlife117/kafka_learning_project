const bookingService = require('../services/booking.service');

async function create(req, res) {
  const booking = await bookingService.bookClass({
    memberId: req.user.id,
    classId: req.validated.body.classId,
  });
  res.status(201).json(booking);
}

async function listMine(req, res) {
  res.json(await bookingService.listBookings({ ...req.validated.query, memberId: req.user.id }));
}

async function list(req, res) {
  res.json(await bookingService.listBookings(req.validated.query));
}

async function getById(req, res) {
  res.json(await bookingService.getBooking(req.validated.params.id, req.user));
}

async function cancel(req, res) {
  res.json(await bookingService.cancelBooking(req.validated.params.id, req.user));
}

module.exports = { create, listMine, list, getById, cancel };
