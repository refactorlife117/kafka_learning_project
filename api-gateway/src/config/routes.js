const config = require('./index');

/**
 * Routing table: which public path goes to which service.
 * `/api/<x>` on the gateway is forwarded as `/<x>` to the target service.
 *
 * `isPublic(req)` decides whether a request may pass without a JWT.
 */
const ROUTES = [
  {
    name: 'member-service',
    prefix: '/api/auth',
    target: config.services.member,
    isPublic: () => true,
    strictRateLimit: true,
  },
  {
    name: 'member-service',
    prefix: '/api/members',
    target: config.services.member,
    isPublic: () => false,
  },
  {
    name: 'class-service',
    prefix: '/api/classes',
    target: config.services.class,
    isPublic: (req) => req.method === 'GET',
  },
  {
    name: 'class-service',
    prefix: '/api/trainers',
    target: config.services.class,
    isPublic: (req) => req.method === 'GET',
  },
  {
    name: 'booking-service',
    prefix: '/api/bookings',
    target: config.services.booking,
    isPublic: () => false,
  },
];

module.exports = { ROUTES };
