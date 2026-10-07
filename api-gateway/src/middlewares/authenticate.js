const jwt = require('jsonwebtoken');
const { IDENTITY_HEADERS, UnauthorizedError } = require('@fitness/common');
const config = require('../config');

function readBearerToken(req) {
  const header = req.get('authorization');
  if (!header || !header.startsWith('Bearer ')) return null;
  return header.slice('Bearer '.length).trim();
}

/**
 * Verifies the JWT once at the edge and forwards the caller's identity to the
 * downstream service as trusted x-user-* headers.
 * On public routes a token is optional; if present, the identity is forwarded.
 */
function authenticate(route) {
  return (req, _res, next) => {
    // Never trust identity headers sent by the client — only the gateway sets them
    for (const header of Object.values(IDENTITY_HEADERS)) delete req.headers[header];

    const token = readBearerToken(req);
    if (!token) {
      if (route.isPublic(req)) return next();
      throw new UnauthorizedError();
    }

    let claims;
    try {
      claims = jwt.verify(token, config.jwtSecret);
    } catch {
      throw new UnauthorizedError('Invalid or expired token');
    }

    req.user = { id: claims.sub, email: claims.email, role: claims.role };
    req.headers[IDENTITY_HEADERS.id] = claims.sub;
    req.headers[IDENTITY_HEADERS.email] = claims.email;
    req.headers[IDENTITY_HEADERS.role] = claims.role;
    next();
  };
}

module.exports = { authenticate };
