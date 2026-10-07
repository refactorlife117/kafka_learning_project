const { Router } = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const config = require('../config');
const { ROUTES } = require('../config/routes');
const { authenticate } = require('../middlewares/authenticate');
const { authLimiter } = require('../middlewares/rate-limiter');

function createServiceProxy(route) {
  return createProxyMiddleware({
    target: route.target,
    changeOrigin: true,
    proxyTimeout: config.proxyTimeoutMs,
    // /api/classes/123?x=1  ->  /classes/123?x=1
    pathRewrite: (_path, req) => req.originalUrl.replace(/^\/api/, ''),
    on: {
      error: (err, req, res) => {
        req.log.error({ err, service: route.name }, 'Upstream service unavailable');
        if (!res.headersSent) res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: { code: 'BAD_GATEWAY', message: `${route.name} is currently unavailable` },
          }),
        );
      },
    },
  });
}

function createProxyRouter() {
  const router = Router();

  for (const route of ROUTES) {
    const middlewares = [authenticate(route), createServiceProxy(route)];
    if (route.strictRateLimit) middlewares.unshift(authLimiter);
    router.use(route.prefix, ...middlewares);
  }

  return router;
}

module.exports = { createProxyRouter };
