const jwt = require('jsonwebtoken');
const config = require('../config');

/** Claims read by the API gateway and forwarded to services as x-user-* headers. */
function signAccessToken(member) {
  return jwt.sign({ email: member.email, role: member.role }, config.jwt.secret, {
    subject: member.id,
    expiresIn: config.jwt.expiresIn,
  });
}

module.exports = { signAccessToken };
