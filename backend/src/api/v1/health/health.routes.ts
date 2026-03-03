import type { FastifyInstance } from 'fastify';
import { checkDbConnection } from '../../../data/db.js';
import { firecrawlService } from '../../../infrastructure/firecrawl/firecrawl.service.js';
import { APP_VERSION } from '../../../config/constants.js';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /health
   * Basic liveness + readiness check.
   * Verifies the server is up and the database connection is healthy.
   */
  app.get(
    '/health',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  status: { type: 'string', enum: ['ok', 'degraded'] },
                  database: { type: 'string', enum: ['connected', 'error'] },
                  uptime: { type: 'number' },
                  version: { type: 'string' },
                  timestamp: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const dbOk = await checkDbConnection();

      const status = dbOk ? 'ok' : 'degraded';
      const httpStatus = dbOk ? 200 : 503;

      return reply.status(httpStatus).send({
        success: dbOk,
        data: {
          status,
          database: dbOk ? 'connected' : 'error',
          uptime: process.uptime(),
          version: APP_VERSION,
          timestamp: new Date().toISOString(),
        },
      });
    },
  );

  /**
   * GET /health/services
   * External service dependency check.
   * Verifies Firecrawl API connectivity and credit balance.
   */
  app.get(
    '/health/services',
    {
      schema: {
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: {
                type: 'object',
                properties: {
                  firecrawl: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', enum: ['ok', 'error'] },
                      creditsRemaining: { type: 'number' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (_request, reply) => {
      const firecrawlHealth = await firecrawlService.healthCheck();

      const allOk = firecrawlHealth.ok;

      return reply.status(allOk ? 200 : 503).send({
        success: allOk,
        data: {
          firecrawl: {
            status: firecrawlHealth.ok ? 'ok' : 'error',
            creditsRemaining: firecrawlHealth.creditsRemaining,
          },
        },
      });
    },
  );
}
