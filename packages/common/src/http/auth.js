const { UnauthorizedError, ForbiddenError } = require('../errors');

/**
 * The API gateway verifies the JWT and forwards the identity as headers.
 * Services trust these headers, so they must only be reachable through the
 * gateway (private network) — never expose service ports publicly.
 */
const IDENTITY_HEADERS = {
  id: 'x-user-id',
  email: 'x-user-email',
  role: 'x-user-role',
};

function authenticate(req, _res, next) {
  const id = req.get(IDENTITY_HEADERS.id);
  if (!id) throw new UnauthorizedError();

  req.user = {
    id,
    email: req.get(IDENTITY_HEADERS.email),
    role: req.get(IDENTITY_HEADERS.role),
  };
  next();
}

function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) throw new UnauthorizedError();
    if (!allowedRoles.includes(req.user.role)) throw new ForbiddenError();
    next();
  };
}

module.exports = { IDENTITY_HEADERS, authenticate, authorize };
