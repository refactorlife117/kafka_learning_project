const { Router } = require('express');
const config = require('../config');

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

/** Aggregated health of every downstream service. */
router.get('/health/services', async (_req, res) => {
  const checks = await Promise.all(
    Object.entries(config.services).map(async ([name, url]) => {
      try {
        const response = await fetch(`${url}/health`, { signal: AbortSignal.timeout(2000) });
        return [name, response.ok ? 'ok' : 'unavailable'];
      } catch {
        return [name, 'unreachable'];
      }
    }),
  );

  const services = Object.fromEntries(checks);
  const allHealthy = Object.values(services).every((status) => status === 'ok');
  res.status(allHealthy ? 200 : 503).json({ status: allHealthy ? 'ok' : 'degraded', services });
});

module.exports = router;
