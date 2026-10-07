const { z } = require('zod');
const { BOOKING_STATUS } = require('../constants');

const bookingIdParams = z.object({ id: z.string().uuid() });

const createBookingSchema = z.object({ classId: z.string().uuid() }).strict();

const pagination = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

const myBookingsQuery = z.object({
  status: z.enum(Object.values(BOOKING_STATUS)).optional(),
  ...pagination,
});

const listBookingsQuery = z.object({
  classId: z.string().uuid().optional(),
  memberId: z.string().uuid().optional(),
  status: z.enum(Object.values(BOOKING_STATUS)).optional(),
  ...pagination,
});

module.exports = { bookingIdParams, createBookingSchema, myBookingsQuery, listBookingsQuery };
