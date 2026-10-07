const { withTransaction, NotFoundError, ForbiddenError } = require('@fitness/common');
const pool = require('../db/pool');
const memberRepository = require('../repositories/member.repository');
const memberPublisher = require('../events/publishers/member.publisher');

// eslint-disable-next-line no-unused-vars
const toPublicMember = ({ passwordHash, ...member }) => member;

async function getById(id) {
  const member = await memberRepository.findById(id);
  if (!member) throw new NotFoundError('Member not found');
  return toPublicMember(member);
}

async function getForRequester(id, requester) {
  if (requester.role !== 'admin' && requester.id !== id) throw new ForbiddenError();
  return getById(id);
}

async function list({ page, pageSize, role }) {
  const { items, total } = await memberRepository.findAll({
    limit: pageSize,
    offset: (page - 1) * pageSize,
    role,
  });
  return { items: items.map(toPublicMember), page, pageSize, total };
}

async function updateAndPublish(id, changes) {
  const member = await withTransaction(pool, async (client) => {
    const updated = await memberRepository.update(id, changes, client);
    if (!updated) throw new NotFoundError('Member not found');
    await memberPublisher.memberUpdated(client, updated);
    return updated;
  });
  return toPublicMember(member);
}

const updateProfile = (id, changes) => updateAndPublish(id, changes);

const changeRole = (id, role) => updateAndPublish(id, { role });

module.exports = { toPublicMember, getById, getForRequester, list, updateProfile, changeRole };
