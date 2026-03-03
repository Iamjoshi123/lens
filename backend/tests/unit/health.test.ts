/**
 * Unit tests for health routes.
 *
 * Uses app.inject() — no real HTTP server or port needed.
 * DB and Firecrawl are mocked so these tests run without any infrastructure.
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('../../src/data/db.js', () => ({
  checkDbConnection: vi.fn().mockResolvedValue(true),
  getPool: vi.fn().mockReturnValue({ on: vi.fn() }),
  db: {},
}));

vi.mock('../../src/infrastructure/firecrawl/firecrawl.service.js', () => ({
  firecrawlService: {
    healthCheck: vi.fn().mockResolvedValue({ ok: true, creditsRemaining: 500 }),
  },
  FirecrawlService: vi.fn(),
}));

// BullMQ queue — don't need real Redis for unit tests
vi.mock('../../src/infrastructure/queue/queue.js', () => ({
  closeAllQueues: vi.fn().mockResolvedValue(undefined),
  getScreenshotQueue: vi.fn(),
  getLandingPageQueue: vi.fn(),
  getFreshnessCheckQueue: vi.fn(),
  getTierRecalcQueue: vi.fn(),
  redisConnection: {},
}));

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 with ok status when DB is connected', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(200);

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

    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.data.database).toBe('connected');
    expect(typeof body.data.uptime).toBe('number');
    expect(body.data.uptime).toBeGreaterThanOrEqual(0);
    expect(body.data.version).toBe('1.0.0');
    expect(body.data.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns 503 with degraded status when DB is unreachable', async () => {
    const { checkDbConnection } = await import('../../src/data/db.js');
    vi.mocked(checkDbConnection).mockResolvedValueOnce(false);

    const response = await app.inject({ method: 'GET', url: '/health' });

    expect(response.statusCode).toBe(503);
    const body = response.json<{ success: boolean; data: { status: string; database: string } }>();
    expect(body.success).toBe(false);
    expect(body.data.status).toBe('degraded');
    expect(body.data.database).toBe('error');
  });

  it('responds quickly (under 200ms for mocked dependencies)', async () => {
    const start = Date.now();
    await app.inject({ method: 'GET', url: '/health' });
    expect(Date.now() - start).toBeLessThan(200);
  });
});

describe('GET /health/services', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 with firecrawl ok when service is reachable', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/services' });

    expect(response.statusCode).toBe(200);

    const body = response.json<{
      success: boolean;
      data: { firecrawl: { status: string; creditsRemaining: number } };
    }>();

    expect(body.success).toBe(true);
    expect(body.data.firecrawl.status).toBe('ok');
    expect(body.data.firecrawl.creditsRemaining).toBe(500);
  });

  it('returns 503 when Firecrawl is unreachable', async () => {
    const { firecrawlService } = await import(
      '../../src/infrastructure/firecrawl/firecrawl.service.js'
    );
    vi.mocked(firecrawlService.healthCheck).mockResolvedValueOnce({
      ok: false,
      creditsRemaining: 0,
    });

    const response = await app.inject({ method: 'GET', url: '/health/services' });

    expect(response.statusCode).toBe(503);
    const body = response.json<{
      success: boolean;
      data: { firecrawl: { status: string } };
    }>();
    expect(body.success).toBe(false);
    expect(body.data.firecrawl.status).toBe('error');
  });
});

describe('404 handling', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns structured 404 for unknown routes', async () => {
    const response = await app.inject({ method: 'GET', url: '/does-not-exist' });

    expect(response.statusCode).toBe(404);
    const body = response.json<{ success: boolean; error: { code: string } }>();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('NOT_FOUND');
  });
});

describe('GET /api/v1/ping', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('confirms /api/v1 prefix is registered', async () => {
    const response = await app.inject({ method: 'GET', url: '/api/v1/ping' });
    expect(response.statusCode).toBe(200);
    const body = response.json<{ success: boolean; data: { pong: boolean } }>();
    expect(body.success).toBe(true);
    expect(body.data.pong).toBe(true);
  });
});
