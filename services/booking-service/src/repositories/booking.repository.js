const pool = require('../db/pool');

const SELECT_DETAILED = `
  SELECT b.*,
         c.title AS class_title, c.category AS class_category, c.trainer_name,
         c.starts_at AS class_starts_at, c.duration_minutes AS class_duration_minutes,
         m.first_name AS member_first_name, m.last_name AS member_last_name, m.email AS member_email
    FROM bookings b
    JOIN class_snapshots c ON c.id = b.class_id
    JOIN member_snapshots m ON m.id = b.member_id`;

const toBooking = (row) =>
  row && {
    id: row.id,
    status: row.status,
    cancellationReason: row.cancellation_reason,
    createdAt: row.created_at,
    cancelledAt: row.cancelled_at,
    member: {
      id: row.member_id,
      name: row.member_first_name && `${row.member_first_name} ${row.member_last_name}`,
      email: row.member_email,
    },
    class: {
      id: row.class_id,
      title: row.class_title,
      category: row.class_category,
      trainerName: row.trainer_name,
      startsAt: row.class_starts_at,
      durationMinutes: row.class_duration_minutes,
    },
  };

async function create({ memberId, classId }, db = pool) {
  const { rows } = await db.query(
    'INSERT INTO bookings (member_id, class_id) VALUES ($1, $2) RETURNING id',
    [memberId, classId],
  );
  return findById(rows[0].id, db);
}

async function findById(id, db = pool) {
  const { rows } = await db.query(`${SELECT_DETAILED} WHERE b.id = $1`, [id]);
  return toBooking(rows[0]);
}

async function lockById(id, db) {
  const { rows } = await db.query('SELECT id FROM bookings WHERE id = $1 FOR UPDATE', [id]);
  return rows.length > 0;
}

async function findMany({ memberId, classId, status, limit, offset }, db = pool) {
  const { rows } = await db.query(
    `${SELECT_DETAILED}
      WHERE ($1::uuid IS NULL OR b.member_id = $1)
        AND ($2::uuid IS NULL OR b.class_id = $2)
        AND ($3::text IS NULL OR b.status = $3)
      ORDER BY c.starts_at DESC
      LIMIT $4 OFFSET $5`,
    [memberId ?? null, classId ?? null, status ?? null, limit, offset],
  );
  return rows.map(toBooking);
}

async function existsConfirmed({ memberId, classId }, db = pool) {
  const { rows } = await db.query(
    `SELECT 1 FROM bookings WHERE member_id = $1 AND class_id = $2 AND status = 'confirmed'`,
    [memberId, classId],
  );
  return rows.length > 0;
}

async function countConfirmedForClass(classId, db = pool) {
  const { rows } = await db.query(
    `SELECT count(*)::int AS count FROM bookings WHERE class_id = $1 AND status = 'confirmed'`,
    [classId],
  );
  return rows[0].count;
}

async function countUpcomingConfirmedForMember(memberId, db = pool) {
  const { rows } = await db.query(
    `SELECT count(*)::int AS count
       FROM bookings b
       JOIN class_snapshots c ON c.id = b.class_id
      WHERE b.member_id = $1 AND b.status = 'confirmed' AND c.starts_at > now()`,
    [memberId],
  );
  return rows[0].count;
}

async function cancel(id, reason, db = pool) {
  await db.query(
    `UPDATE bookings
        SET status = 'cancelled', cancellation_reason = $2, cancelled_at = now(), updated_at = now()
      WHERE id = $1`,
    [id, reason],
  );
  return findById(id, db);
}

/** Cancels every confirmed booking of a class and returns the affected rows. */
async function cancelAllForClass(classId, reason, db = pool) {
  const { rows } = await db.query(
    `UPDATE bookings
        SET status = 'cancelled', cancellation_reason = $2, cancelled_at = now(), updated_at = now()
      WHERE class_id = $1 AND status = 'confirmed'
      RETURNING id, member_id, class_id`,
    [classId, reason],
  );
  return rows.map((row) => ({ id: row.id, memberId: row.member_id, classId: row.class_id }));
}

module.exports = {
  create,
  findById,
  lockById,
  findMany,
  existsConfirmed,
  countConfirmedForClass,
  countUpcomingConfirmedForMember,
  cancel,
  cancelAllForClass,
};
