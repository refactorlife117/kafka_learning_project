const pool = require('../db/pool');

const toTrainer = (row) =>
  row && {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    fullName: `${row.first_name} ${row.last_name}`,
    active: row.active,
  };

async function upsert(trainer, db = pool) {
  await db.query(
    `INSERT INTO trainers (id, email, first_name, last_name, active)
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           active = true,
           updated_at = now()`,
    [trainer.id, trainer.email, trainer.firstName, trainer.lastName],
  );
}

async function deactivate(id, db = pool) {
  await db.query('UPDATE trainers SET active = false, updated_at = now() WHERE id = $1', [id]);
}

async function findActiveById(id, db = pool) {
  const { rows } = await db.query('SELECT * FROM trainers WHERE id = $1 AND active', [id]);
  return toTrainer(rows[0]);
}

async function findAllActive(db = pool) {
  const { rows } = await db.query(
    'SELECT * FROM trainers WHERE active ORDER BY first_name, last_name',
  );
  return rows.map(toTrainer);
}

module.exports = { upsert, deactivate, findActiveById, findAllActive };
