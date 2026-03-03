/**
 * score-backfill.ts
 *
 * One-shot script: score every ad that has no performance_score yet,
 * and propagate tier to linked video rows.
 *
 * Usage:
 *   npm run score:backfill
 */

import { db } from '../data/db.js';
import { ads, videos } from '../data/schema.js';
import { isNull, eq } from 'drizzle-orm';
import { scoreAndPersistAd } from '../domain/scoring/scoring.service.js';

async function main() {
  console.log('⏳  Scoring backfill starting…');

  // 1. Score ads with no score yet
  const unscored = await db.select().from(ads).where(isNull(ads.performanceScore));
  console.log(`   Found ${unscored.length} unscored ads`);

  let adsDone = 0;
  for (const ad of unscored) {
    const result = await scoreAndPersistAd(ad);
    console.log(`   [ad] ${ad.brandName} → score=${result.score} tier=${result.tier}`);
    adsDone++;
  }

  // 2. Score videos that have a sourceAdId but no tier
  //    (videos seeded without a source ad still need a tier from their own metrics)
  const unscoredVideos = await db
    .select()
    .from(videos)
    .where(isNull(videos.performanceTier));

  console.log(`   Found ${unscoredVideos.length} untiered videos (no linked ad)`);

  // For standalone videos (no source ad), derive tier from spendCents + impressions
  // as a simple proxy: map spend tiers to video performance tiers
  for (const v of unscoredVideos) {
    // Skip if we already propagated from its source ad
    if (v.sourceAdId) continue;

    // Simple heuristic for standalone videos: map spend quartiles
    const spendCents = Number(v.spendCents ?? 0);
    let tier: 'TOP' | 'HIGH' | 'MID' | 'LOW';
    if (spendCents > 5_000_000) tier = 'TOP';
    else if (spendCents > 2_000_000) tier = 'HIGH';
    else if (spendCents > 500_000) tier = 'MID';
    else tier = 'LOW';

    await db.update(videos).set({ performanceTier: tier }).where(eq(videos.id, v.id));
    console.log(`   [video] "${v.title}" → tier=${tier}`);
  }

  console.log(`\n✅  Done — ${adsDone} ads scored, ${unscoredVideos.length} videos tiered`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
