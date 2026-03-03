/**
 * Ad repository — database operations for the ads table.
 *
 * Handles deduplication logic: match on external_id (per platform)
 * or content_hash. On match → update last_seen_at. On miss → insert.
 */

import { and, eq, or, sql, desc, inArray } from 'drizzle-orm';
import { db, type Database } from '../db.js';
import { ads, type Ad } from '../schema.js';
import type { NormalizedAd } from '../../domain/normalization/ad-normalizer.js';
import { scoreAndPersistAd } from '../../domain/scoring/scoring.service.js';

export interface UpsertResult {
  ad: Ad;
  isNew: boolean;
}

/**
 * Find an existing ad by external_id+platform or content_hash.
 * Returns the first match or null.
 */
export async function findExistingAd(
  normalized: NormalizedAd,
  database: Database = db,
): Promise<Ad | null> {
  const conditions = [];

  if (normalized.externalId) {
    conditions.push(
      and(
        eq(ads.externalId, normalized.externalId),
        eq(ads.platform, normalized.platform),
      ),
    );
  }

  conditions.push(eq(ads.contentHash, normalized.contentHash));

  const [existing] = await database
    .select()
    .from(ads)
    .where(or(...conditions))
    .limit(1);

  return existing ?? null;
}

/**
 * Upsert a single ad: insert if new, update last_seen_at if existing.
 * Returns the ad record and whether it was newly created.
 */
export async function upsertAd(
  normalized: NormalizedAd,
  database: Database = db,
): Promise<UpsertResult> {
  const existing = await findExistingAd(normalized, database);

  if (existing) {
    // Update existing ad — refresh last_seen_at and merge any new data
    const [updated] = await database
      .update(ads)
      .set({
        lastSeenAt: new Date(),
        isActive: true,
        consecutiveMissCount: 0,
        // Update fields that may have been enriched since last scrape
        ...(normalized.headline && !existing.headline ? { headline: normalized.headline } : {}),
        ...(normalized.ctaText && !existing.ctaText ? { ctaText: normalized.ctaText } : {}),
        ...(normalized.landingPageUrl && !existing.landingPageUrl
          ? { landingPageUrl: normalized.landingPageUrl }
          : {}),
        ...(normalized.brandLogoUrl && !existing.brandLogoUrl
          ? { brandLogoUrl: normalized.brandLogoUrl }
          : {}),
        ...(normalized.externalId && !existing.externalId
          ? { externalId: normalized.externalId }
          : {}),
        updatedAt: sql`NOW()`,
      })
      .where(eq(ads.id, existing.id))
      .returning();

    return { ad: updated!, isNew: false };
  }

  // Insert new ad
  const [created] = await database
    .insert(ads)
    .values({
      externalId: normalized.externalId,
      contentHash: normalized.contentHash,
      platform: normalized.platform,
      brandName: normalized.brandName,
      brandLogoUrl: normalized.brandLogoUrl,
      adCopy: normalized.adCopy,
      headline: normalized.headline,
      ctaText: normalized.ctaText,
      landingPageUrl: normalized.landingPageUrl,
      mediaType: normalized.mediaType,
      mediaUrls: normalized.mediaUrls,
      videoDurationSec: normalized.videoDurationSec,
      firstSeenAt: normalized.firstSeenAt,
      lastSeenAt: normalized.lastSeenAt,
      isActive: normalized.isActive,
      sourceUrl: normalized.sourceUrl,
      rawScrapedData: normalized.rawScrapedData,
    })
    .returning();

  return { ad: created!, isNew: true };
}

/**
 * Upsert a batch of normalized ads. Returns all upserted ads
 * and the list of newly created ad IDs (for screenshot queuing).
 */
export async function upsertAdBatch(
  normalizedAds: NormalizedAd[],
  database: Database = db,
): Promise<{ ads: Ad[]; newAdIds: string[] }> {
  const results: Ad[] = [];
  const newAdIds: string[] = [];

  for (const normalized of normalizedAds) {
    const { ad, isNew } = await upsertAd(normalized, database);
    // Auto-score every ad (new or updated) so tier stays fresh
    const scored = await scoreAndPersistAd(ad, database);
    results.push({ ...ad, performanceScore: scored.score, performanceTier: scored.tier });
    if (isNew) {
      newAdIds.push(ad.id);
    }
  }

  return { ads: results, newAdIds };
}

/**
 * Get ads by IDs. Preserves order of input IDs.
 */
export async function getAdsByIds(
  ids: string[],
  database: Database = db,
): Promise<Ad[]> {
  if (ids.length === 0) return [];

  const result = await database
    .select()
    .from(ads)
    .where(inArray(ads.id, ids));

  // Preserve input order
  const byId = new Map(result.map((a) => [a.id, a]));
  return ids.map((id) => byId.get(id)).filter((a): a is Ad => a !== undefined);
}

/**
 * Get a single ad by ID.
 */
export async function getAdById(
  id: string,
  database: Database = db,
): Promise<Ad | null> {
  const [result] = await database
    .select()
    .from(ads)
    .where(eq(ads.id, id))
    .limit(1);

  return result ?? null;
}
