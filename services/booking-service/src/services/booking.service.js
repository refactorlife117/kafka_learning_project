const {
  withTransaction,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} = require('@fitness/common');
const pool = require('../db/pool');
const bookingRepository = require('../repositories/booking.repository');
const classSnapshotRepository = require('../repositories/class-snapshot.repository');
const memberSnapshotRepository = require('../repositories/member-snapshot.repository');
const bookingPublisher = require('../events/publishers/booking.publisher');
const { BOOKING_STATUS, CANCELLATION_REASONS, PLAN_BOOKING_LIMITS } = require('../constants');

const hasStarted = (startsAt) => new Date(startsAt) <= new Date();

async function bookClass({ memberId, classId }) {
  return withTransaction(pool, async (client) => {
    const member = await memberSnapshotRepository.findById(memberId, client);
    if (!member) {
      // Eventual consistency: member.registered may not have reached us yet
      throw new ConflictError('Your profile is still being set up, please retry in a few seconds');
    }

    const gymClass = await classSnapshotRepository.findByIdForUpdate(classId, client);
    if (!gymClass) throw new NotFoundError('Class not found');
    if (gymClass.status !== 'scheduled') throw new ConflictError('Class is not open for booking');
    if (hasStarted(gymClass.startsAt)) throw new ConflictError('Class has already started');

    if (await bookingRepository.existsConfirmed({ memberId, classId }, client)) {
      throw new ConflictError('You have already booked this class');
    }

    const booked = await bookingRepository.countConfirmedForClass(classId, client);
    if (booked >= gymClass.capacity) throw new ConflictError('Class is full');

    const limit = PLAN_BOOKING_LIMITS[member.membershipPlan] ?? 0;
    const upcoming = await bookingRepository.countUpcomingConfirmedForMember(memberId, client);
    if (upcoming >= limit) {
      throw new ForbiddenError(
        `Your ${member.membershipPlan} plan allows ${limit} upcoming bookings. Upgrade your plan to book more.`,
      );
    }

    const booking = await bookingRepository.create({ memberId, classId }, client);
    await bookingPublisher.bookingConfirmed(client, booking);
    return booking;
  });
}

async function cancelBooking(id, requester) {
  return withTransaction(pool, async (client) => {
    if (!(await bookingRepository.lockById(id, client))) {
      throw new NotFoundError('Booking not found');
    }

    const booking = await bookingRepository.findById(id, client);
    if (requester.role !== 'admin' && booking.member.id !== requester.id) {
      throw new NotFoundError('Booking not found');
    }
    if (booking.status === BOOKING_STATUS.CANCELLED) {
      throw new ConflictError('Booking is already cancelled');
    }
    if (hasStarted(booking.class.startsAt)) throw new ConflictError('Class has already started');

    const reason = CANCELLATION_REASONS.MEMBER_CANCELLED;
    const cancelled = await bookingRepository.cancel(id, reason, client);
    await bookingPublisher.bookingCancelled(
      client,
      { id, memberId: booking.member.id, classId: booking.class.id },
      reason,
    );
    return cancelled;
  });
}

async function getBooking(id, requester) {
  const booking = await bookingRepository.findById(id);
  const canView = booking && (requester.role !== 'member' || booking.member.id === requester.id);
  if (!canView) throw new NotFoundError('Booking not found');
  return booking;
}

async function listBookings({ page, pageSize, ...filters }) {
  const items = await bookingRepository.findMany({
    ...filters,
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  return { items, page, pageSize };
}

module.exports = { bookClass, cancelBooking, getBooking, listBookings };
