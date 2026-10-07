const bcrypt = require('bcryptjs');
const { withTransaction, ConflictError, UnauthorizedError } = require('@fitness/common');
const pool = require('../db/pool');
const memberRepository = require('../repositories/member.repository');
const memberPublisher = require('../events/publishers/member.publisher');
const { signAccessToken } = require('./token.service');
const { toPublicMember } = require('./member.service');

const BCRYPT_ROUNDS = 10;

async function register(input, { role = 'member' } = {}) {
  const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

  // Member row + outbox event are committed atomically
  const member = await withTransaction(pool, async (client) => {
    const existing = await memberRepository.findByEmail(input.email, client);
    if (existing) throw new ConflictError('An account with this email already exists');

    const created = await memberRepository.create(
      {
        email: input.email,
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role,
        membershipPlan: input.membershipPlan,
      },
      client,
    );
    await memberPublisher.memberRegistered(client, created);
    return created;
  });

  return { member: toPublicMember(member), accessToken: signAccessToken(member) };
}

async function login({ email, password }) {
  const member = await memberRepository.findByEmail(email);
  const passwordMatches = member && (await bcrypt.compare(password, member.passwordHash));
  if (!passwordMatches) throw new UnauthorizedError('Invalid email or password');

  return { member: toPublicMember(member), accessToken: signAccessToken(member) };
}

module.exports = { register, login };
