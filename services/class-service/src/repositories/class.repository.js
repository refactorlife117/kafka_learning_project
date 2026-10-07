const pool = require('../db/pool');

const SELECT_WITH_TRAINER = `
  SELECT c.*, t.first_name AS trainer_first_name, t.last_name AS trainer_last_name
    FROM gym_classes c
    JOIN trainers t ON t.id = c.trainer_id`;

const toGymClass = (row) =>
  row && {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    trainer: {
      id: row.trainer_id,
      name: row.trainer_first_name && `${row.trainer_first_name} ${row.trainer_last_name}`,
    },
    room: row.room,
    startsAt: row.starts_at,
    durationMinutes: row.duration_minutes,
    capacity: row.capacity,
    bookedCount: row.booked_count,
    spotsLeft: Math.max(row.capacity - row.booked_count, 0),
    status: row.status,
    cancellationReason: row.cancellation_reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

async function create(gymClass, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO gym_classes
       (title, description, category, trainer_id, room, starts_at, duration_minutes, capacity)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id`,
    [
      gymClass.title,
      gymClass.description ?? null,
      gymClass.category,
      gymClass.trainerId,
      gymClass.room ?? null,
      gymClass.startsAt,
      gymClass.durationMinutes,
      gymClass.capacity,
    ],
  );
  return findById(rows[0].id, db);
}

async function findById(id, db = pool) {
  const { rows } = await db.query(`${SELECT_WITH_TRAINER} WHERE c.id = $1`, [id]);
  return toGymClass(rows[0]);
}

async function findMany({ from, to, category, trainerId, status, limit, offset }, db = pool) {
  const { rows } = await db.query(
    `${SELECT_WITH_TRAINER}
      WHERE ($1::timestamptz IS NULL OR c.starts_at >= $1)
        AND ($2::timestamptz IS NULL OR c.starts_at <  $2)
        AND ($3::text IS NULL OR c.category = $3)
        AND ($4::uuid IS NULL OR c.trainer_id = $4)
        AND ($5::text IS NULL OR c.status = $5)
      ORDER BY c.starts_at
      LIMIT $6 OFFSET $7`,
    [from ?? null, to ?? null, category ?? null, trainerId ?? null, status ?? null, limit, offset],
  );
  return rows.map(toGymClass);
}

async function cancel(id, reason, db = pool) {
  await db.query(
    `UPDATE gym_classes
        SET status = 'cancelled', cancellation_reason = $2, updated_at = now()
      WHERE id = $1`,
    [id, reason ?? null],
  );
  return findById(id, db);
}

/** Applies +1 / -1 from booking events. Never goes below zero. */
async function adjustBookedCount(id, delta, db = pool) {
  const { rowCount } = await db.query(
    `UPDATE gym_classes
        SET booked_count = GREATEST(booked_count + $2, 0), updated_at = now()
      WHERE id = $1`,
    [id, delta],
  );
  return rowCount > 0;
}

module.exports = { create, findById, findMany, cancel, adjustBookedCount };
