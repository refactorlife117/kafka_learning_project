const pool = require('../db/pool');

const toMemberSnapshot = (row) =>
  row && {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    membershipPlan: row.membership_plan,
  };

async function upsert(member, db = pool) {
  await db.query(
    `INSERT INTO member_snapshots (id, email, first_name, last_name, membership_plan)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE
       SET email = EXCLUDED.email,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           membership_plan = EXCLUDED.membership_plan,
           updated_at = now()`,
    [member.id, member.email, member.firstName, member.lastName, member.membershipPlan],
  );
}

async function findById(id, db = pool) {
  const { rows } = await db.query('SELECT * FROM member_snapshots WHERE id = $1', [id]);
  return toMemberSnapshot(rows[0]);
}

module.exports = { upsert, findById };
