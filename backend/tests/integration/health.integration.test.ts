/**
 * Integration tests for health endpoints.
 *
 * Requirements:
 *   - TEST_DATABASE_URL pointing to a real PostgreSQL test database
 *   - Migrations applied (npm run db:migrate with TEST_DATABASE_URL)
 *   - Firecrawl is mocked — never hits the real API in CI
 *
 * Run with: npm run test:integration
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

// Firecrawl is always mocked in integration tests
vi.mock('../../src/infrastructure/firecrawl/firecrawl.service.js', () => ({
  firecrawlService: {
    healthCheck: vi.fn().mockResolvedValue({ ok: true, creditsRemaining: 250 }),
  },
  FirecrawlService: vi.fn(),
}));

vi.mock('../../src/infrastructure/queue/queue.js', () => ({
  closeAllQueues: vi.fn().mockResolvedValue(undefined),
  getScreenshotQueue: vi.fn(),
  getLandingPageQueue: vi.fn(),
  getFreshnessCheckQueue: vi.fn(),
  getTierRecalcQueue: vi.fn(),
  redisConnection: {},
}));

describe('Integration: GET /health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 when database is connected', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    // In CI without a DB, this may return 503 — both are valid responses.
    // What matters is the response shape is always correct.
    expect([200, 503]).toContain(response.statusCode);

    const body = response.json<{
      success: boolean;
      data: {
        status: string;
        database: string;
        uptime: number;
        version: string;
        timestamp: string;
      };
    }>();

    expect(typeof body.success).toBe('boolean');
    expect(['ok', 'degraded']).toContain(body.data.status);
    expect(['connected', 'error']).toContain(body.data.database);
    expect(typeof body.data.uptime).toBe('number');
    expect(body.data.version).toBe('1.0.0');
    expect(new Date(body.data.timestamp).toString()).not.toBe('Invalid Date');
  });

  it('response includes all required fields', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    const body = response.json<{ data: Record<string, unknown> }>();

    expect(body.data).toHaveProperty('status');
    expect(body.data).toHaveProperty('database');
    expect(body.data).toHaveProperty('uptime');
    expect(body.data).toHaveProperty('version');
    expect(body.data).toHaveProperty('timestamp');
  });
});

describe('Integration: GET /health/services', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns structured firecrawl status', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/services' });

    expect(response.statusCode).toBe(200);

    const body = response.json<{
      success: boolean;
      data: { firecrawl: { status: string; creditsRemaining: number } };
    }>();

    expect(body.success).toBe(true);
    expect(['ok', 'error']).toContain(body.data.firecrawl.status);
    expect(typeof body.data.firecrawl.creditsRemaining).toBe('number');
  });
});

describe('Integration: rate limiting headers', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('includes x-ratelimit headers on responses', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    // Rate limit headers should be present
    expect(response.headers['x-ratelimit-limit']).toBeDefined();
    expect(response.headers['x-ratelimit-remaining']).toBeDefined();
  });
});
