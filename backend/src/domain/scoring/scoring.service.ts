/**
 * Scoring service — bridges the pure scorer with the database.
 *
 * Responsibilities:
 *   1. Load an Ad from the DB
 *   2. Run scoreAd() to get score + tier
 *   3. Write performanceScore + performanceTier back to ads row
 *   4. If the ad has a linked video row, propagate the tier there too
 */

import { eq, isNull } from 'drizzle-orm';
import { db, type Database } from '../../data/db.js';
import { ads, videos } from '../../data/schema.js';
import type { Ad } from '../../data/schema.js';
import { scoreAd, type ScoringResult } from './ad-scorer.js';

/**
 * Score a single ad (by its DB row) and persist the result.
 * Returns the ScoringResult so callers can log / return it.
 */
export async function scoreAndPersistAd(
  ad: Ad,
  database: Database = db,
): Promise<ScoringResult> {
  const result = scoreAd({
    firstSeenAt: ad.firstSeenAt,
    lastSeenAt: ad.lastSeenAt,
    isActive: ad.isActive,
    estimatedSpend: ad.estimatedSpend,
    engagementLikes: ad.engagementLikes,
    engagementComments: ad.engagementComments,
    engagementShares: ad.engagementShares,
    mediaType: ad.mediaType,
  });

  // 1. Update the ads row
  await database
    .update(ads)
    .set({
      performanceScore: result.score,
      performanceTier: result.tier,
    })
    .where(eq(ads.id, ad.id));

  // 2. Propagate tier to any linked video rows
  await database
    .update(videos)
    .set({ performanceTier: result.tier })
    .where(eq(videos.sourceAdId, ad.id));

  return result;
}

/**
 * Score an ad by ID — loads the row first, then delegates.
 * Returns null if the ad doesn't exist.
 */
export async function scoreAdById(
  adId: string,
  database: Database = db,
): Promise<ScoringResult | null> {
  const [ad] = await database.select().from(ads).where(eq(ads.id, adId)).limit(1);
  if (!ad) return null;
  return scoreAndPersistAd(ad, database);
}

/**
 * Score a batch of ad rows (used after upsertAdBatch).
 * Runs sequentially to avoid overwhelming the DB.
 */
export async function scoreBatch(
  adRows: Ad[],
  database: Database = db,
): Promise<void> {
  for (const ad of adRows) {
    await scoreAndPersistAd(ad, database);
  }
}

/**
 * Backfill — scores every ad that currently has no performance_score set.
 * Returns the count of ads scored.
 */
export async function scoreAllUnscored(database: Database = db): Promise<number> {
  const unscored = await database
    .select()
    .from(ads)
    .where(isNull(ads.performanceScore));

  for (const ad of unscored) {
    await scoreAndPersistAd(ad, database);
  }

  return unscored.length;
}
