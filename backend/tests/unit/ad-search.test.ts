/**
 * Unit tests for POST /api/v1/ads/search endpoint.
 *
 * All external dependencies (Firecrawl, DB) are mocked.
 * Tests the full request→response flow including validation,
 * normalization, error handling, and response shape.
 */

import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from 'vitest';
import { buildApp } from '../../src/app.js';
import type { FastifyInstance } from 'fastify';
import type { RawMetaAdExtraction } from '../../src/domain/normalization/ad-normalizer.js';

// ── Load fixture ──────────────────────────────────────────────────────────────

import fixtureData from '../fixtures/meta-ad-library-response.json' with { type: 'json' };

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockSearchMetaAds = vi.fn();
const mockSearchTikTokAds = vi.fn();
const mockHealthCheck = vi.fn().mockResolvedValue({ ok: true, creditsRemaining: 500 });

vi.mock('../../src/infrastructure/firecrawl/firecrawl.service.js', () => ({
  firecrawlService: {
    searchMetaAds: (...args: unknown[]) => mockSearchMetaAds(...args),
    searchTikTokAds: (...args: unknown[]) => mockSearchTikTokAds(...args),
    healthCheck: () => mockHealthCheck(),
  },
  FirecrawlService: vi.fn(),
  FirecrawlServiceError: class extends Error {
    code: string;
    retryable: boolean;
    constructor(message: string, code: string, retryable: boolean) {
      super(message);
      this.name = 'FirecrawlServiceError';
      this.code = code;
      this.retryable = retryable;
    }
  },
}));

const mockUpsertAdBatch = vi.fn();
const mockGetAdById = vi.fn();

vi.mock('../../src/data/repositories/ad.repository.js', () => ({
  upsertAdBatch: (...args: unknown[]) => mockUpsertAdBatch(...args),
  getAdById: (...args: unknown[]) => mockGetAdById(...args),
}));

const mockLogSearch = vi.fn();

vi.mock('../../src/data/repositories/search-query.repository.js', () => ({
  logSearch: (...args: unknown[]) => mockLogSearch(...args),
}));

vi.mock('../../src/data/db.js', () => ({
  checkDbConnection: vi.fn().mockResolvedValue(true),
  getPool: vi.fn().mockReturnValue({ on: vi.fn() }),
  db: {},
}));

vi.mock('../../src/infrastructure/queue/queue.js', () => ({
  closeAllQueues: vi.fn().mockResolvedValue(undefined),
  getScreenshotQueue: vi.fn(),
  getLandingPageQueue: vi.fn(),
  getFreshnessCheckQueue: vi.fn(),
  getTierRecalcQueue: vi.fn(),
  redisConnection: {},
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeMockAd(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'ad-uuid-001',
    externalId: 'fb_ad_001',
    contentHash: 'abc123',
    platform: 'META',
    brandName: 'LumiSkin',
    brandLogoUrl: null,
    adCopy: 'Great serum',
    headline: 'Vitamin C Serum',
    ctaText: 'Shop Now',
    landingPageUrl: 'https://lumiskin.com',
    mediaType: 'VIDEO',
    mediaUrls: ['https://example.com/thumb.jpg'],
    screenshotUrl: null,
    videoDurationSec: 15,
    firstSeenAt: new Date('2026-01-15'),
    lastSeenAt: new Date('2026-02-27'),
    isActive: true,
    estimatedSpend: null,
    engagementLikes: null,
    engagementComments: null,
    engagementShares: null,
    sourceUrl: 'https://facebook.com/ads/library',
    rawScrapedData: {},
    performanceTier: null,
    performanceScore: null,
    consecutiveMissCount: 0,
    landingPageTitle: null,
    landingPageHeadline: null,
    landingPageOffer: null,
    landingPageScreenshot: null,
    landingPageScrapedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('POST /api/v1/ads/search', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mocks: Firecrawl returns fixture data, DB upsert succeeds
    mockSearchMetaAds.mockResolvedValue({
      ads: fixtureData.extract.ads,
      sourceUrl: fixtureData.metadata.sourceURL,
      screenshotUrl: fixtureData.screenshot,
    });

    mockSearchTikTokAds.mockResolvedValue({
      ads: [],
      sourceUrl: 'https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en',
    });

    mockUpsertAdBatch.mockResolvedValue({
      ads: [makeMockAd(), makeMockAd({ id: 'ad-uuid-002', brandName: 'GlowMask Beauty' })],
      newAdIds: ['ad-uuid-001'],
    });

    mockLogSearch.mockResolvedValue({
      id: 'search-uuid-001',
      queryText: 'skincare serum',
      platformFilter: 'META',
      filtersApplied: {},
      resultsCount: 2,
      createdAt: new Date(),
    });
  });

  // ── Successful search ─────────────────────────────────────────────────────

  it('returns structured results for a valid META search', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: { query: 'skincare serum', platform: 'META' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.success).toBe(true);
    expect(body.data.results).toBeInstanceOf(Array);
    expect(body.data.results.length).toBe(2);
    expect(body.data.totalFound).toBe(2);
    expect(body.data.searchId).toBe('search-uuid-001');
  });

  it('passes query and options to Firecrawl service', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: {
        query: 'vitamin c serum',
        platform: 'META',
        country: 'GB',
        adType: 'video',
        limit: 10,
      },
    });

    expect(mockSearchMetaAds).toHaveBeenCalledWith('vitamin c serum', {
      country: 'GB',
      adType: 'video',
      activeStatus: 'active',
      limit: 10,
    });
  });

  it('response DTOs do not expose raw_scraped_data or consecutive_miss_count', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: { query: 'skincare', platform: 'META' },
    });

    const body = response.json();
    const firstAd = body.data.results[0];

    expect(firstAd).not.toHaveProperty('rawScrapedData');
    expect(firstAd).not.toHaveProperty('raw_scraped_data');
    expect(firstAd).not.toHaveProperty('consecutiveMissCount');
    expect(firstAd).not.toHaveProperty('contentHash');
  });

  it('response DTOs include computed daysActive', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: { query: 'skincare', platform: 'META' },
    });

    const body = response.json();
    const firstAd = body.data.results[0];
    expect(firstAd).toHaveProperty('daysActive');
    expect(typeof firstAd.daysActive).toBe('number');
    expect(firstAd.daysActive).toBeGreaterThanOrEqual(0);
  });

  it('logs the search to the audit trail', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: { query: 'skincare serum', platform: 'META' },
    });

    expect(mockLogSearch).toHaveBeenCalledTimes(1);
    expect(mockLogSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        queryText: 'skincare serum',
        platformFilter: 'META',
        resultsCount: 2,
      }),
    );
  });

  // ── Validation errors ─────────────────────────────────────────────────────

  it('rejects missing query', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: { platform: 'META' },
    });

    expect(response.statusCode).toBe(400);
    const body = response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  it('rejects query shorter than 2 chars', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: { query: 'a', platform: 'META' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects query longer than 200 chars', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: { query: 'x'.repeat(201), platform: 'META' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects missing platform', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: { query: 'skincare serum' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects invalid platform', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: { query: 'skincare', platform: 'INSTAGRAM' },
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects limit > 50', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: { query: 'skincare', platform: 'META', limit: 100 },
    });

    expect(response.statusCode).toBe(400);
  });

  it('rejects limit < 1', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: { query: 'skincare', platform: 'META', limit: 0 },
    });

    expect(response.statusCode).toBe(400);
  });

  // ── TikTok search ─────────────────────────────────────────────────────────

  it('calls searchTikTokAds and returns 200 for TIKTOK platform', async () => {
    mockSearchTikTokAds.mockResolvedValue({
      ads: [
        { advertiserName: 'GlowBrand', adCaption: 'Try our serum', durationSec: 15 },
      ],
      sourceUrl: 'https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en',
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: { query: 'protein powder', platform: 'TIKTOK' },
    });

    expect(response.statusCode).toBe(200);
    expect(mockSearchTikTokAds).toHaveBeenCalledWith(
      'protein powder',
      expect.objectContaining({ period: '30d' }),
    );
    const body = response.json();
    expect(body.success).toBe(true);
  });

  // ── Firecrawl error handling ──────────────────────────────────────────────

  it('returns 503 when Firecrawl times out', async () => {
    const { FirecrawlServiceError } = await import(
      '../../src/infrastructure/firecrawl/firecrawl.service.js'
    );
    mockSearchMetaAds.mockRejectedValue(
      new FirecrawlServiceError('Timeout', 'TIMEOUT', true),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: { query: 'skincare serum', platform: 'META' },
    });

    expect(response.statusCode).toBe(503);
    const body = response.json();
    expect(body.error.code).toBe('SERVICE_TIMEOUT');
  });

  it('returns 429 when Firecrawl rate limit is hit', async () => {
    const { FirecrawlServiceError } = await import(
      '../../src/infrastructure/firecrawl/firecrawl.service.js'
    );
    mockSearchMetaAds.mockRejectedValue(
      new FirecrawlServiceError('Rate limited', 'RATE_LIMIT', true),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: { query: 'skincare serum', platform: 'META' },
    });

    expect(response.statusCode).toBe(429);
    expect(response.headers['retry-after']).toBe('60');
  });

  it('returns 503 when Firecrawl credits are exhausted', async () => {
    const { FirecrawlServiceError } = await import(
      '../../src/infrastructure/firecrawl/firecrawl.service.js'
    );
    mockSearchMetaAds.mockRejectedValue(
      new FirecrawlServiceError('No credits', 'CREDIT_EXHAUSTED', false),
    );

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: { query: 'skincare serum', platform: 'META' },
    });

    expect(response.statusCode).toBe(503);
    const body = response.json();
    expect(body.error.code).toBe('CREDITS_EXHAUSTED');
  });

  // ── Empty results ─────────────────────────────────────────────────────────

  it('handles zero results gracefully', async () => {
    mockSearchMetaAds.mockResolvedValue({
      ads: [],
      sourceUrl: 'https://facebook.com/ads/library',
    });
    mockUpsertAdBatch.mockResolvedValue({ ads: [], newAdIds: [] });
    mockLogSearch.mockResolvedValue({
      id: 'search-uuid-empty',
      queryText: 'nonexistent',
      resultsCount: 0,
      createdAt: new Date(),
    });

    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/ads/search',
      payload: { query: 'xyznonexistent', platform: 'META' },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data.results).toEqual([]);
    expect(body.data.totalFound).toBe(0);
  });
});
