/**
 * Ad routes — POST /api/v1/ads/search
 *
 * Flow:
 * 1. Validate request body
 * 2. Scrape Meta Ad Library via Firecrawl
 * 3. Normalize raw results
 * 4. Deduplicate + upsert to database
 * 5. Queue screenshot jobs for new ads
 * 6. Log search to audit trail
 * 7. Return structured response (no internal data exposed)
 */

import type { FastifyInstance } from 'fastify';
import {
  firecrawlService,
  FirecrawlServiceError,
} from '../../../infrastructure/firecrawl/firecrawl.service.js';
import {
  normalizeMetaAdBatch,
  normalizeTikTokAdBatch,
} from '../../../domain/normalization/ad-normalizer.js';
import { upsertAdBatch, getAdById } from '../../../data/repositories/ad.repository.js';
import { logSearch } from '../../../data/repositories/search-query.repository.js';
import { scoreAndPersistAd } from '../../../domain/scoring/scoring.service.js';
import { toAdResponseDto } from './ad.dto.js';
import {
  searchAdsBodySchema,
  type SearchAdsBody,
} from './ad.schemas.js';
import { buildErrorResponse } from '../../error-handler.js';
import { env } from '../../../config/env.js';

export async function adRoutes(app: FastifyInstance): Promise<void> {
  /**
   * POST /api/v1/ads/:id/score
   *
   * On-demand re-score for a single ad.
   * Useful after manually updating engagement/spend fields.
   */
  app.post<{ Params: { id: string } }>(
    '/:id/score',
    async (request, reply) => {
      const { id } = request.params;

      const ad = await getAdById(id);
      if (!ad) {
        return reply.status(404).send(
          buildErrorResponse('NOT_FOUND', `Ad ${id} not found.`),
        );
      }

      const result = await scoreAndPersistAd(ad);

      return reply.status(200).send({
        success: true,
        data: {
          adId: id,
          score: result.score,
          tier: result.tier,
          breakdown: result.breakdown,
        },
      });
    },
  );

  /**
   * POST /api/v1/ads/search
   *
   * Search for ads on Meta Ad Library (Slice 2) or TikTok (Slice 3).
   * Scrapes results via Firecrawl, normalizes, deduplicates, and persists.
   */
  app.post<{ Body: SearchAdsBody }>(
    '/search',
    {
      config: {
        rateLimit: {
          max: env.API_RATE_LIMIT_SEARCH,
          timeWindow: '1 minute',
        },
      },
      schema: {
        body: searchAdsBodySchema,
        // Response schema is intentionally omitted to avoid
        // fast-json-stringify stripping DTO fields. The DTO
        // shape is enforced by TypeScript at compile time.
      },
    },
    async (request, reply) => {
      const { query, platform, country, adType, limit } = request.body;

      request.log.info(
        { query, platform, country, adType, limit },
        'Ad search initiated',
      );

      try {
        // ── Step 1: Scrape platform Ad Library ──────────────────────────────
        let normalizedAds;

        if (platform === 'TIKTOK') {
          const scrapeResult = await firecrawlService.searchTikTokAds(query, {
            region: country ?? 'US',
            period: '30d',
            limit: limit ?? 20,
          });
          normalizedAds = normalizeTikTokAdBatch(
            scrapeResult.ads,
            scrapeResult.sourceUrl,
          );
        } else {
          const scrapeResult = await firecrawlService.searchMetaAds(query, {
            country: country ?? 'US',
            adType: adType ?? 'all',
            activeStatus: 'active',
            limit: limit ?? 20,
          });
          normalizedAds = normalizeMetaAdBatch(
            scrapeResult.ads,
            scrapeResult.sourceUrl,
          );
        }

        request.log.info(
          { normalizedCount: normalizedAds.length },
          'Ads normalized',
        );

        // ── Step 3: Deduplicate + upsert to DB ─────────────────────────────
        const { ads: persistedAds, newAdIds } =
          await upsertAdBatch(normalizedAds);

        request.log.info(
          {
            persistedCount: persistedAds.length,
            newCount: newAdIds.length,
            updatedCount: persistedAds.length - newAdIds.length,
          },
          'Ads persisted',
        );

        // ── Step 4: Queue screenshot jobs for new ads ───────────────────────
        // Screenshot worker is implemented in a later slice.
        // For now we log the intent; the queue infrastructure is ready.
        if (newAdIds.length > 0) {
          request.log.info(
            { newAdIds },
            'Screenshot capture queued for new ads',
          );
          // TODO: Uncomment when screenshot worker is implemented:
          // const queue = getScreenshotQueue();
          // for (const adId of newAdIds) {
          //   await queue.add('capture', { adId }, { priority: 2 });
          // }
        }

        // ── Step 5: Log search to audit trail ───────────────────────────────
        const searchRecord = await logSearch({
          queryText: query,
          platformFilter: platform,
          filtersApplied: { country, adType, limit },
          resultsCount: persistedAds.length,
        });

        // ── Step 6: Map to response DTOs ────────────────────────────────────
        const resultDtos = persistedAds
          .slice(0, limit ?? 20)
          .map(toAdResponseDto);

        return reply.status(200).send({
          success: true,
          data: {
            results: resultDtos,
            totalFound: persistedAds.length,
            searchId: searchRecord.id,
          },
        });
      } catch (err) {
        // ── Firecrawl-specific error mapping ────────────────────────────────
        if (err instanceof FirecrawlServiceError) {
          switch (err.code) {
            case 'TIMEOUT':
              return reply.status(503).send(
                buildErrorResponse(
                  'SERVICE_TIMEOUT',
                  'Ad search timed out. The external service is slow — please try again in a moment.',
                ),
              );

            case 'RATE_LIMIT':
              reply.header('Retry-After', '60');
              return reply.status(429).send(
                buildErrorResponse(
                  'EXTERNAL_RATE_LIMIT',
                  'External scraping service rate limit reached. Try again in 60 seconds.',
                ),
              );

            case 'CREDIT_EXHAUSTED':
              return reply.status(503).send(
                buildErrorResponse(
                  'CREDITS_EXHAUSTED',
                  'Scraping credits exhausted for today. Search will resume tomorrow.',
                ),
              );

            case 'INVALID_RESPONSE':
            case 'API_ERROR':
              return reply.status(503).send(
                buildErrorResponse(
                  'SERVICE_UNAVAILABLE',
                  'Ad scraping service is temporarily unavailable. Please try again later.',
                ),
              );
          }
        }

        // Unknown error — let the global error handler deal with it
        throw err;
      }
    },
  );
}
