const pool = require('../db/pool');

const toClassSnapshot = (row) =>
  row && {
    id: row.id,
    title: row.title,
    category: row.category,
    trainerName: row.trainer_name,
    startsAt: row.starts_at,
    durationMinutes: row.duration_minutes,
    capacity: row.capacity,
    status: row.status,
  };

async function upsert(gymClass, db = pool) {
  await db.query(
    `INSERT INTO class_snapshots
       (id, title, category, trainer_name, starts_at, duration_minutes, capacity, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE
       SET title = EXCLUDED.title,
           category = EXCLUDED.category,
           trainer_name = EXCLUDED.trainer_name,
           starts_at = EXCLUDED.starts_at,
           duration_minutes = EXCLUDED.duration_minutes,
           capacity = EXCLUDED.capacity,
           status = EXCLUDED.status,
           updated_at = now()`,
    [
      gymClass.id,
      gymClass.title,
      gymClass.category,
      gymClass.trainerName,
      gymClass.startsAt,
      gymClass.durationMinutes,
      gymClass.capacity,
      gymClass.status,
    ],
  );
}

async function updateStatus(id, status, db = pool) {
  await db.query('UPDATE class_snapshots SET status = $2, updated_at = now() WHERE id = $1', [
    id,
    status,
  ]);
}

/**
 * Locks the class row until the transaction ends. Two members booking the last
 * spot at the same time are serialised here, so capacity can't be exceeded.
 */
async function findByIdForUpdate(id, db) {
  const { rows } = await db.query('SELECT * FROM class_snapshots WHERE id = $1 FOR UPDATE', [id]);
  return toClassSnapshot(rows[0]);
}

module.exports = { upsert, updateStatus, findByIdForUpdate };
