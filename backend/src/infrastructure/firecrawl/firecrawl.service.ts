/**
 * Firecrawl Service
 *
 * Wraps the Firecrawl API with:
 * - Retry logic with exponential backoff
 * - Structured error logging
 * - Credit usage tracking
 * - Circuit-breaker-style graceful degradation
 *
 * Slice 1: healthCheck()
 * Slice 2: searchMetaAds(), captureScreenshot()
 * Slices 3–4: searchTikTokAds, scrapeAdDetail, scrapeLandingPage
 */

import FirecrawlApp from '@mendable/firecrawl-js';
import { env } from '../../config/env.js';
import { logger } from '../logger/index.js';
import type {
  RawMetaAdExtraction,
  MetaAdExtractionResult,
  RawTikTokAdExtraction,
  TikTokAdExtractionResult,
} from '../../domain/normalization/ad-normalizer.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface HealthCheckResult {
  ok: boolean;
  creditsRemaining: number;
}

export interface SearchMetaAdsOptions {
  country?: string;
  adType?: 'all' | 'image' | 'video';
  activeStatus?: 'active' | 'inactive' | 'all';
  limit?: number;
}

export interface SearchMetaAdsResult {
  ads: RawMetaAdExtraction[];
  sourceUrl: string;
  screenshotUrl?: string;
}

export interface SearchTikTokAdsOptions {
  region?: string;        // e.g. 'US', 'GB' — maps to TikTok's region filter
  industry?: string;      // TikTok industry label, e.g. 'Beauty & Personal Care'
  objective?: string;     // Campaign objective, e.g. 'Traffic', 'Conversions'
  period?: '7d' | '30d' | '180d';
  limit?: number;
}

export interface SearchTikTokAdsResult {
  ads: RawTikTokAdExtraction[];
  sourceUrl: string;
}

export interface LandingPageData {
  title?: string;
  headline?: string;
  offer?: string;
  metaDescription?: string;
  pricing?: string;
  socialProofElements?: string[];
  screenshotUrl?: string;
  scrapedAt: Date;
}

export class FirecrawlServiceError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'TIMEOUT'
      | 'RATE_LIMIT'
      | 'INVALID_RESPONSE'
      | 'API_ERROR'
      | 'CREDIT_EXHAUSTED',
    public readonly retryable: boolean,
  ) {
    super(message);
    this.name = 'FirecrawlServiceError';
  }
}

// ─── Retry helper ─────────────────────────────────────────────────────────────

async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    baseDelayMs: number;
    operationName: string;
  },
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (err instanceof FirecrawlServiceError && !err.retryable) {
        throw err;
      }

      if (attempt < options.maxRetries) {
        const delayMs = options.baseDelayMs * Math.pow(2, attempt);
        logger.warn(
          {
            operation: options.operationName,
            attempt: attempt + 1,
            maxRetries: options.maxRetries,
            delayMs,
            error: lastError.message,
          },
          `Firecrawl retry ${attempt + 1}/${options.maxRetries}`,
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  throw lastError;
}

// ─── Extraction schema ────────────────────────────────────────────────────────

/**
 * JSON schema sent to Firecrawl's LLM extraction.
 * Instructs the model on what to extract from Meta Ad Library pages.
 */
const META_AD_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    ads: {
      type: 'array',
      description: 'Array of ad creatives visible on the page',
      items: {
        type: 'object',
        properties: {
          adLibraryId: {
            type: 'string',
            description: 'The unique Meta Ad Library ID for this ad, if visible',
          },
          pageName: {
            type: 'string',
            description: 'The Facebook page or advertiser name',
          },
          pageLogoUrl: {
            type: 'string',
            description: 'URL of the advertiser profile image',
          },
          adText: {
            type: 'string',
            description:
              'The primary text/body copy of the ad (the main message)',
          },
          headline: {
            type: 'string',
            description:
              'The headline shown below the creative (shorter, bold text)',
          },
          ctaButtonText: {
            type: 'string',
            description:
              'Call-to-action button text like "Shop Now", "Learn More", "Sign Up"',
          },
          linkUrl: {
            type: 'string',
            description: 'The destination URL / landing page URL',
          },
          mediaType: {
            type: 'string',
            enum: ['image', 'video', 'carousel'],
            description: 'Type of creative asset',
          },
          imageUrls: {
            type: 'array',
            items: { type: 'string' },
            description: 'URLs of images or video thumbnails in the ad',
          },
          isActive: {
            type: 'boolean',
            description: 'Whether the ad is currently active/running',
          },
          startedRunning: {
            type: 'string',
            description:
              'Date when the ad started running, in YYYY-MM-DD format if available',
          },
        },
        required: ['pageName', 'adText'],
      },
    },
  },
  required: ['ads'],
} as const;

const META_AD_EXTRACTION_PROMPT =
  'Extract all visible ad creatives from this Meta Ad Library search results page. ' +
  'For each ad card, extract the advertiser/page name, the ad body text, headline, ' +
  'CTA button text, destination URL, media type, and any image URLs. ' +
  'If an ad has multiple variants, extract each variant as a separate entry. ' +
  'Return an empty ads array if no ads are found.';

// ─── TikTok extraction schema ─────────────────────────────────────────────────

const TIKTOK_AD_EXTRACTION_SCHEMA = {
  type: 'object',
  properties: {
    ads: {
      type: 'array',
      description: 'Array of top-performing TikTok ad creatives',
      items: {
        type: 'object',
        properties: {
          advertiserName: {
            type: 'string',
            description: 'Brand or advertiser name shown on the ad card',
          },
          adCaption: {
            type: 'string',
            description: 'Primary caption or text copy of the ad',
          },
          videoUrl: {
            type: 'string',
            description: 'URL of the ad video, if visible or extractable',
          },
          thumbnailUrl: {
            type: 'string',
            description: 'Thumbnail / cover image URL of the ad video',
          },
          ctaText: {
            type: 'string',
            description: 'Call-to-action button text, e.g. "Shop Now", "Learn More"',
          },
          landingPageUrl: {
            type: 'string',
            description: 'Destination / landing page URL',
          },
          industry: {
            type: 'string',
            description: 'Industry or category label shown for the ad',
          },
          objective: {
            type: 'string',
            description: 'Campaign objective label, e.g. "Traffic", "Conversions"',
          },
          likes: {
            type: 'number',
            description: 'Like count shown on the ad card, if visible',
          },
          views: {
            type: 'number',
            description: 'View / play count shown on the ad card, if visible',
          },
          durationSec: {
            type: 'number',
            description: 'Video duration in seconds, if shown',
          },
          adId: {
            type: 'string',
            description: 'TikTok ad ID, if extractable from the page',
          },
        },
        required: ['advertiserName'],
      },
    },
  },
  required: ['ads'],
} as const;

const TIKTOK_AD_EXTRACTION_PROMPT =
  'Extract all visible top-performing TikTok ad creatives from this TikTok Creative Center page. ' +
  'For each ad card, extract the advertiser/brand name, ad caption text, thumbnail URL, ' +
  'CTA button text, landing page URL, industry, campaign objective, and engagement metrics ' +
  '(likes, views) if shown. Return an empty ads array if no ads are found.';

// ─── Service ──────────────────────────────────────────────────────────────────

export class FirecrawlService {
  private readonly client: FirecrawlApp;

  constructor(apiKey?: string) {
    this.client = new FirecrawlApp({
      apiKey: apiKey ?? env.FIRECRAWL_API_KEY,
    });
  }

  // ── Health check (Slice 1) ──────────────────────────────────────────────────

  async healthCheck(): Promise<HealthCheckResult> {
    const start = Date.now();

    try {
      const result = await withRetry(
        () =>
          Promise.race([
            this.client.scrapeUrl('https://example.com', {
              formats: ['markdown'],
              onlyMainContent: true,
            }),
            new Promise<never>((_, reject) =>
              setTimeout(
                () =>
                  reject(
                    new FirecrawlServiceError(
                      'Health check timeout',
                      'TIMEOUT',
                      true,
                    ),
                  ),
                env.FIRECRAWL_TIMEOUT_MS,
              ),
            ),
          ]),
        {
          maxRetries: 1,
          baseDelayMs: 500,
          operationName: 'healthCheck',
        },
      );

      const durationMs = Date.now() - start;
      logger.info(
        { durationMs, success: result.success ?? true },
        'Firecrawl health check passed',
      );

      return { ok: true, creditsRemaining: -1 };
    } catch (err) {
      const durationMs = Date.now() - start;
      logger.error({ err, durationMs }, 'Firecrawl health check failed');
      return { ok: false, creditsRemaining: 0 };
    }
  }

  // ── Meta Ad Library search (Slice 2) ────────────────────────────────────────

  /**
   * Build the Meta Ad Library URL with query parameters.
   */
  private buildMetaAdLibraryUrl(
    query: string,
    options: SearchMetaAdsOptions,
  ): string {
    const params = new URLSearchParams({
      active_status: options.activeStatus ?? 'active',
      ad_type: options.adType ?? 'all',
      country: options.country ?? 'US',
      q: query,
      search_type: 'keyword_unordered',
      media_type: 'all',
    });

    return `https://www.facebook.com/ads/library/?${params.toString()}`;
  }

  /**
   * Search Meta Ad Library for ads matching a query.
   *
   * Uses Firecrawl browser actions to:
   * 1. Navigate to the Ad Library URL
   * 2. Wait for React SPA to render
   * 3. Scroll to load more results
   * 4. Extract structured ad data using LLM
   */
  async searchMetaAds(
    query: string,
    options: SearchMetaAdsOptions = {},
  ): Promise<SearchMetaAdsResult> {
    const sourceUrl = this.buildMetaAdLibraryUrl(query, options);
    const start = Date.now();

    logger.info(
      { query, options, sourceUrl },
      'Starting Meta Ad Library search via Firecrawl',
    );

    try {
      const result = await withRetry(
        () =>
          Promise.race([
            this.client.scrapeUrl(sourceUrl, {
              formats: ['extract', 'screenshot'] as never,
              extract: {
                schema: META_AD_EXTRACTION_SCHEMA,
                prompt: META_AD_EXTRACTION_PROMPT,
              } as never,
              actions: [
                // Wait for the SPA to render
                { type: 'wait', milliseconds: 3000 },
                // Scroll down to trigger lazy loading
                { type: 'scroll', direction: 'down', amount: 3 },
                // Wait for new content to render
                { type: 'wait', milliseconds: 2000 },
              ] as never,
              // Firecrawl server-side budget — must be generous for heavy SPAs.
              // Our outer Promise.race uses env.FIRECRAWL_TIMEOUT_MS as a hard cap.
              timeout: 90000,
            } as never),
            new Promise<never>((_, reject) =>
              setTimeout(
                () =>
                  reject(
                    new FirecrawlServiceError(
                      `Meta Ad Library search timed out after ${env.FIRECRAWL_TIMEOUT_MS}ms`,
                      'TIMEOUT',
                      true,
                    ),
                  ),
                env.FIRECRAWL_TIMEOUT_MS + 5000, // outer timeout > Firecrawl timeout
              ),
            ),
          ]),
        {
          maxRetries: env.FIRECRAWL_MAX_RETRIES,
          baseDelayMs: env.FIRECRAWL_RETRY_DELAY_MS,
          operationName: 'searchMetaAds',
        },
      );

      const durationMs = Date.now() - start;

      // Validate response
      if (!result || !result.success) {
        logger.error(
          { durationMs, result },
          'Firecrawl returned unsuccessful response for Meta Ad search',
        );
        throw new FirecrawlServiceError(
          'Firecrawl returned unsuccessful response',
          'API_ERROR',
          true,
        );
      }

      // Extract the structured data — cast through unknown since
      // the SDK's ScrapeResponse type doesn't have an index signature.
      const resultObj = result as unknown as Record<string, unknown>;
      const extractData = resultObj['extract'] as
        | MetaAdExtractionResult
        | undefined;

      const extractedAds: RawMetaAdExtraction[] = extractData?.ads ?? [];
      const screenshotUrl = resultObj['screenshot'] as string | undefined;

      logger.info(
        {
          durationMs,
          adsExtracted: extractedAds.length,
          query,
          hasScreenshot: !!screenshotUrl,
        },
        'Meta Ad Library search completed',
      );

      const searchResult: SearchMetaAdsResult = {
        ads: extractedAds,
        sourceUrl,
      };
      if (screenshotUrl) {
        searchResult.screenshotUrl = screenshotUrl;
      }
      return searchResult;
    } catch (err) {
      const durationMs = Date.now() - start;

      // Map known error types
      if (err instanceof FirecrawlServiceError) {
        throw err;
      }

      const message = err instanceof Error ? err.message : String(err);

      // Detect rate limiting
      if (message.includes('429') || message.toLowerCase().includes('rate limit')) {
        throw new FirecrawlServiceError(
          'Firecrawl rate limit exceeded',
          'RATE_LIMIT',
          true,
        );
      }

      // Detect credit exhaustion
      if (message.includes('402') || message.toLowerCase().includes('credit')) {
        throw new FirecrawlServiceError(
          'Firecrawl credits exhausted',
          'CREDIT_EXHAUSTED',
          false,
        );
      }

      logger.error(
        { err, durationMs, query },
        'Firecrawl Meta Ad search failed',
      );

      throw new FirecrawlServiceError(
        `Meta Ad Library search failed: ${message}`,
        'API_ERROR',
        true,
      );
    }
  }

  // ── Screenshot capture (Slice 2) ────────────────────────────────────────────

  /**
   * Capture a screenshot of a URL. Returns the screenshot URL.
   */
  async captureScreenshot(url: string): Promise<string> {
    const start = Date.now();

    try {
      const result = await withRetry(
        () =>
          this.client.scrapeUrl(url, {
            formats: ['screenshot'] as never,
            timeout: env.FIRECRAWL_TIMEOUT_MS,
          } as never),
        {
          maxRetries: 2,
          baseDelayMs: env.FIRECRAWL_RETRY_DELAY_MS,
          operationName: 'captureScreenshot',
        },
      );

      const durationMs = Date.now() - start;
      const screenshotUrl = (result as unknown as Record<string, unknown>)
        .screenshot as string | undefined;

      if (!screenshotUrl) {
        throw new FirecrawlServiceError(
          'No screenshot returned by Firecrawl',
          'INVALID_RESPONSE',
          true,
        );
      }

      logger.info({ durationMs, url }, 'Screenshot captured');
      return screenshotUrl;
    } catch (err) {
      if (err instanceof FirecrawlServiceError) throw err;

      const durationMs = Date.now() - start;
      const message = err instanceof Error ? err.message : String(err);
      logger.error({ err, durationMs, url }, 'Screenshot capture failed');
      throw new FirecrawlServiceError(
        `Screenshot capture failed: ${message}`,
        'API_ERROR',
        true,
      );
    }
  }

  // ── TikTok Creative Center search (Slice 5) ──────────────────────────────────

  /**
   * Build the TikTok Creative Center Top Ads URL with query parameters.
   * TikTok uses query strings: period (7/30/180), region, industry, objective.
   */
  private buildTikTokCreativeCenterUrl(
    query: string,
    options: SearchTikTokAdsOptions,
  ): string {
    // Map our period strings to TikTok's numeric period param
    const periodMap: Record<string, string> = {
      '7d': '7',
      '30d': '30',
      '180d': '180',
    };
    const period = periodMap[options.period ?? '30d'] ?? '30';

    const params = new URLSearchParams({
      period,
      ...(options.region ? { region: options.region } : {}),
      ...(options.industry ? { industry: options.industry } : {}),
      ...(options.objective ? { objective: options.objective } : {}),
      ...(query ? { keyword: query } : {}),
    });

    return `https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en?${params.toString()}`;
  }

  /**
   * Search TikTok Creative Center for top-performing ads.
   *
   * Uses Firecrawl browser actions to:
   * 1. Navigate to Creative Center Top Ads URL
   * 2. Wait for SPA to render
   * 3. Scroll to load more cards
   * 4. Extract structured ad data using LLM
   */
  async searchTikTokAds(
    query: string,
    options: SearchTikTokAdsOptions = {},
  ): Promise<SearchTikTokAdsResult> {
    const sourceUrl = this.buildTikTokCreativeCenterUrl(query, options);
    const start = Date.now();

    logger.info(
      { query, options, sourceUrl },
      'Starting TikTok Creative Center search via Firecrawl',
    );

    try {
      const result = await withRetry(
        () =>
          Promise.race([
            this.client.scrapeUrl(sourceUrl, {
              formats: ['extract'] as never,
              extract: {
                schema: TIKTOK_AD_EXTRACTION_SCHEMA,
                prompt: TIKTOK_AD_EXTRACTION_PROMPT,
              } as never,
              actions: [
                // Wait for React SPA to load ad cards
                { type: 'wait', milliseconds: 4000 },
                // Scroll to trigger lazy loading
                { type: 'scroll', direction: 'down', amount: 3 },
                { type: 'wait', milliseconds: 2000 },
              ] as never,
              timeout: 90000,
            } as never),
            new Promise<never>((_, reject) =>
              setTimeout(
                () =>
                  reject(
                    new FirecrawlServiceError(
                      `TikTok Creative Center search timed out after ${env.FIRECRAWL_TIMEOUT_MS}ms`,
                      'TIMEOUT',
                      true,
                    ),
                  ),
                env.FIRECRAWL_TIMEOUT_MS + 5000,
              ),
            ),
          ]),
        {
          maxRetries: env.FIRECRAWL_MAX_RETRIES,
          baseDelayMs: env.FIRECRAWL_RETRY_DELAY_MS,
          operationName: 'searchTikTokAds',
        },
      );

      const durationMs = Date.now() - start;

      if (!result || !result.success) {
        logger.error(
          { durationMs, result },
          'Firecrawl returned unsuccessful response for TikTok search',
        );
        throw new FirecrawlServiceError(
          'Firecrawl returned unsuccessful response',
          'API_ERROR',
          true,
        );
      }

      const resultObj = result as unknown as Record<string, unknown>;
      const extractData = resultObj['extract'] as TikTokAdExtractionResult | undefined;
      const extractedAds: RawTikTokAdExtraction[] = extractData?.ads ?? [];

      logger.info(
        { durationMs, adsExtracted: extractedAds.length, query },
        'TikTok Creative Center search completed',
      );

      return { ads: extractedAds, sourceUrl };
    } catch (err) {
      const durationMs = Date.now() - start;

      if (err instanceof FirecrawlServiceError) throw err;

      const message = err instanceof Error ? err.message : String(err);

      if (message.includes('429') || message.toLowerCase().includes('rate limit')) {
        throw new FirecrawlServiceError('Firecrawl rate limit exceeded', 'RATE_LIMIT', true);
      }

      if (message.includes('402') || message.toLowerCase().includes('credit')) {
        throw new FirecrawlServiceError('Firecrawl credits exhausted', 'CREDIT_EXHAUSTED', false);
      }

      logger.error({ err, durationMs, query }, 'Firecrawl TikTok search failed');
      throw new FirecrawlServiceError(
        `TikTok Creative Center search failed: ${message}`,
        'API_ERROR',
        true,
      );
    }
  }

  async scrapeLandingPage(_url: string): Promise<LandingPageData> {
    throw new Error(
      'scrapeLandingPage not yet implemented',
    );
  }
}

// Singleton — share one client instance across the application
export const firecrawlService = new FirecrawlService();
