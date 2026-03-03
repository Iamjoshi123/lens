/**
 * Fastify application factory.
 * Builds and configures the app without starting the server.
 * Exported for use in tests (app.inject) and index.ts (app.listen).
 */

import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { healthRoutes } from './api/v1/health/health.routes.js';
import { v1Router } from './api/v1/router.js';
import { errorHandler } from './api/error-handler.js';
import { env } from './config/env.js';
import { APP_VERSION } from './config/constants.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      base: { service: 'lens-api', version: APP_VERSION },
      timestamp: () => `,"time":"${new Date().toISOString()}"`,
      ...(env.NODE_ENV === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname,service,version',
          },
        },
      }),
    },
    // Per-request trace ID (propagated to all log lines via request.log)
    requestIdHeader: 'x-trace-id',
    requestIdLogLabel: 'traceId',
    genReqId: () => crypto.randomUUID(),
    // Return detailed error messages in responses (Fastify default: true)
    exposeHeadRoutes: true,
  });

  // ── Plugins ────────────────────────────────────────────────────────────────

  await app.register(cors, {
    origin: env.NODE_ENV === 'production' ? ['https://lens.app'] : true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  await app.register(rateLimit, {
    global: true,
    max: env.API_RATE_LIMIT_CRUD,
    timeWindow: '1 minute',
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
      'retry-after': true,
    },
    errorResponseBuilder: (_request, context) => ({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)}s.`,
      },
    }),
  });

  // ── Error handling (must be set BEFORE routes for encapsulation) ──────────

  app.setErrorHandler(errorHandler);

  app.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist.',
      },
    });
  });

  // ── Routes ─────────────────────────────────────────────────────────────────

  // Health endpoints at root (not under /api/v1)
  await app.register(healthRoutes);

  // Versioned API routes
  await app.register(v1Router, { prefix: '/api/v1' });

  // ── Lifecycle hooks ────────────────────────────────────────────────────────

  app.addHook('onRequest', async (request) => {
    request.log.info(
      { method: request.method, url: request.url },
      'Incoming request',
    );
  });

  app.addHook('onResponse', async (request, reply) => {
    request.log.info(
      {
        method: request.method,
        url: request.url,
        statusCode: reply.statusCode,
        durationMs: Math.round(reply.elapsedTime),
      },
      'Request completed',
    );
  });

  return app;
}
