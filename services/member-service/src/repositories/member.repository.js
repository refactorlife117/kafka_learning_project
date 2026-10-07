const pool = require('../db/pool');

/**
 * Data-access layer: the only place that knows SQL and column names.
 * Every function accepts an optional `db` (pool or transaction client) so it
 * can take part in a caller's transaction.
 */

const toMember = (row) =>
  row && {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    role: row.role,
    membershipPlan: row.membership_plan,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

async function create(member, db = pool) {
  const { rows } = await db.query(
    `INSERT INTO members (email, password_hash, first_name, last_name, phone, role, membership_plan)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      member.email,
      member.passwordHash,
      member.firstName,
      member.lastName,
      member.phone ?? null,
      member.role,
      member.membershipPlan,
    ],
  );
  return toMember(rows[0]);
}

async function findById(id, db = pool) {
  const { rows } = await db.query('SELECT * FROM members WHERE id = $1', [id]);
  return toMember(rows[0]);
}

async function findByEmail(email, db = pool) {
  const { rows } = await db.query('SELECT * FROM members WHERE lower(email) = lower($1)', [email]);
  return toMember(rows[0]);
}

async function findAll({ limit, offset, role }, db = pool) {
  const { rows } = await db.query(
    `SELECT *, count(*) OVER() AS total_count
       FROM members
      WHERE ($1::text IS NULL OR role = $1)
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3`,
    [role ?? null, limit, offset],
  );
  return { items: rows.map(toMember), total: Number(rows[0]?.total_count ?? 0) };
}

const UPDATABLE_COLUMNS = {
  firstName: 'first_name',
  lastName: 'last_name',
  phone: 'phone',
  membershipPlan: 'membership_plan',
  role: 'role',
};

async function update(id, changes, db = pool) {
  const entries = Object.entries(changes).filter(
    ([key, value]) => UPDATABLE_COLUMNS[key] && value !== undefined,
  );
  if (entries.length === 0) return findById(id, db);

  const setClause = entries.map(([key], i) => `${UPDATABLE_COLUMNS[key]} = $${i + 2}`).join(', ');
  const { rows } = await db.query(
    `UPDATE members SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`,
    [id, ...entries.map(([, value]) => value)],
  );
  return toMember(rows[0]);
}

module.exports = { create, findById, findByEmail, findAll, update };
