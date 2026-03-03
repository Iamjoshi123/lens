/**
 * Seed script — populates the database with 5 sample ads for development.
 *
 * Usage:
 *   npm run db:seed
 *
 * Safe to run multiple times (upserts on external_id).
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';
import { env } from '../config/env.js';

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

const SEED_ADS: schema.NewAd[] = [
  {
    externalId: 'meta_seed_001',
    platform: 'META',
    brandName: 'LumiSkin',
    brandLogoUrl: 'https://storage.googleapis.com/lens-seed/logos/lumiskin.png',
    adCopy:
      'POV: You finally found the serum that actually works. 3 weeks of consistent use = this glow ✨ Formulated with 20% Vitamin C + Hyaluronic Acid. First order 20% off.',
    headline: 'Vitamin C Brightening Serum',
    ctaText: 'Shop Now',
    landingPageUrl: 'https://lumiskin.com/products/vitamin-c-serum',
    mediaType: 'VIDEO',
    mediaUrls: ['https://storage.googleapis.com/lens-seed/ads/lumiskin-serum-ugc.mp4'],
    videoDurationSec: 15,
    firstSeenAt: daysAgo(62),
    lastSeenAt: now,
    isActive: true,
    estimatedSpend: '45000',
    engagementLikes: 8420,
    engagementComments: 312,
    engagementShares: 891,
    sourceUrl: 'https://www.facebook.com/ads/library/?id=meta_seed_001',
  },
  {
    externalId: 'tiktok_seed_001',
    platform: 'TIKTOK',
    brandName: 'ProteinPeak',
    brandLogoUrl: 'https://storage.googleapis.com/lens-seed/logos/proteinpeak.png',
    adCopy:
      '25g protein, zero bloat, actually tastes good. Our chocolate fudge flavor just dropped. Try it risk-free with our 30-day money-back guarantee.',
    headline: null,
    ctaText: 'Try Risk-Free',
    landingPageUrl: 'https://proteinpeak.com/chocolate-fudge',
    mediaType: 'VIDEO',
    mediaUrls: ['https://storage.googleapis.com/lens-seed/ads/proteinpeak-choc-unbox.mp4'],
    videoDurationSec: 30,
    firstSeenAt: daysAgo(38),
    lastSeenAt: now,
    isActive: true,
    estimatedSpend: '22000',
    engagementLikes: 15300,
    engagementComments: 742,
    engagementShares: 2100,
    sourceUrl: 'https://ads.tiktok.com/business/creativecenter/inspiration/tiktok_seed_001',
  },
  {
    externalId: 'meta_seed_002',
    platform: 'META',
    brandName: 'FitLife Gear',
    brandLogoUrl: 'https://storage.googleapis.com/lens-seed/logos/fitlifegear.png',
    adCopy:
      'These resistance bands replaced my entire gym setup. 5 resistance levels, anti-snap latex, lifetime warranty. Over 50,000 home athletes trust FitLife.',
    headline: 'Build Strength Anywhere',
    ctaText: 'Get Yours',
    landingPageUrl: 'https://fitlifegear.com/resistance-bands',
    mediaType: 'IMAGE',
    mediaUrls: [
      'https://storage.googleapis.com/lens-seed/ads/fitlife-bands-01.jpg',
      'https://storage.googleapis.com/lens-seed/ads/fitlife-bands-02.jpg',
      'https://storage.googleapis.com/lens-seed/ads/fitlife-bands-03.jpg',
    ],
    videoDurationSec: null,
    firstSeenAt: daysAgo(14),
    lastSeenAt: now,
    isActive: true,
    estimatedSpend: '8500',
    engagementLikes: 2100,
    engagementComments: 88,
    engagementShares: 145,
    sourceUrl: 'https://www.facebook.com/ads/library/?id=meta_seed_002',
  },
  {
    externalId: 'tiktok_seed_002',
    platform: 'TIKTOK',
    brandName: 'GlowMask Beauty',
    brandLogoUrl: 'https://storage.googleapis.com/lens-seed/logos/glowmask.png',
    adCopy:
      'I put this on at 10pm and woke up with the smoothest skin of my life 😭 The overnight hydration mask that beauty editors are obsessed with.',
    headline: null,
    ctaText: 'Shop GlowMask',
    landingPageUrl: 'https://glowmask.co/overnight-mask',
    mediaType: 'VIDEO',
    mediaUrls: ['https://storage.googleapis.com/lens-seed/ads/glowmask-morning-routine.mp4'],
    videoDurationSec: 22,
    firstSeenAt: daysAgo(5),
    lastSeenAt: now,
    isActive: true,
    estimatedSpend: null,
    engagementLikes: 4800,
    engagementComments: 203,
    engagementShares: 567,
    sourceUrl: 'https://ads.tiktok.com/business/creativecenter/inspiration/tiktok_seed_002',
  },
  {
    externalId: 'meta_seed_003',
    platform: 'META',
    brandName: 'SportsFuel',
    brandLogoUrl: 'https://storage.googleapis.com/lens-seed/logos/sportsfuel.png',
    adCopy:
      'Clean energy without the crash. No artificial sweeteners, no proprietary blends. Just 200mg natural caffeine + B vitamins + electrolytes. Your pre-workout, simplified.',
    headline: 'Clean Pre-Workout Energy',
    ctaText: 'Start Your Trial',
    landingPageUrl: 'https://sportsfuel.com/pre-workout-trial',
    mediaType: 'VIDEO',
    mediaUrls: ['https://storage.googleapis.com/lens-seed/ads/sportsfuel-comparison.mp4'],
    videoDurationSec: 45,
    firstSeenAt: daysAgo(90),
    lastSeenAt: daysAgo(3),
    isActive: false,
    estimatedSpend: '67000',
    engagementLikes: 11200,
    engagementComments: 445,
    engagementShares: 1890,
    sourceUrl: 'https://www.facebook.com/ads/library/?id=meta_seed_003',
    consecutiveMissCount: 3,
  },
];

async function seed(): Promise<void> {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('🌱  Starting seed...');

  for (const ad of SEED_ADS) {
    await db
      .insert(schema.ads)
      .values(ad)
      .onConflictDoNothing();
    console.log(`  ✅  Upserted ad: ${ad.brandName} (${ad.externalId})`);
  }

  console.log(`\n🎉  Seed complete — ${SEED_ADS.length} ads upserted.`);
  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
