/**
 * Application entry point.
 * Validates environment, runs migrations, starts the HTTP server.
 */

import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './infrastructure/logger/index.js';
import { closePool } from './data/db.js';
import { closeAllQueues } from './infrastructure/queue/queue.js';

async function main(): Promise<void> {
  logger.info({ version: process.version, nodeEnv: env.NODE_ENV }, 'Starting LENS backend');

  const app = await buildApp();

  // Graceful shutdown handler
  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, 'Shutdown signal received');
    try {
      await app.close();
      await closeAllQueues();
      await closePool();
      logger.info('Graceful shutdown complete');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception');
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ reason }, 'Unhandled promise rejection');
    process.exit(1);
  });

  try {
    await app.listen({ port: env.PORT, host: env.HOST });
    logger.info(
      { port: env.PORT, host: env.HOST, nodeEnv: env.NODE_ENV },
      `LENS API listening`,
    );
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

main();
