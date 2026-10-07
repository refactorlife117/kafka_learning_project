const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs the cleanup tasks in order on SIGINT/SIGTERM so that HTTP connections
 * drain, Kafka consumers leave their group cleanly and DB pools close.
 */
function registerShutdown({ logger, tasks, timeoutMs = 10_000 }) {
  let shuttingDown = false;

  const shutdown = async (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down gracefully');

    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit');
      process.exit(1);
    }, timeoutMs);
    forceExit.unref();

    for (const task of tasks) {
      try {
        await task();
      } catch (err) {
        logger.error({ err }, 'Error during shutdown task');
      }
    }
    logger.info('Shutdown complete');
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

module.exports = { sleep, registerShutdown };
