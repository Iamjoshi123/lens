/**
 * Seed script — populates videos, heatmap zones, transcripts, and sample briefs.
 *
 * Uses real public-domain video assets hosted on GCS/CDN.
 * Safe to run multiple times (upserts by title+brand).
 *
 * Usage:
 *   npm run db:seed:videos
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, and } from 'drizzle-orm';
import * as schema from './schema.js';
import { env } from '../config/env.js';

const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

// ─── Video definitions ─────────────────────────────────────────────────────────

const VIDEOS = [
  {
    title: 'POV: You Finally Found the Serum That Works',
    brand: 'LumiSkin',
    platform: 'META' as const,
    category: 'Skincare',
    // Public domain HLS stream — Sintel trailer (9:16 crop proxy via GCS)
    thumbnailUrl:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerBlazes.jpg',
    videoUrl:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    duration: 15,
    spendCents: '4500000',
    impressions: '2300000',
    ctrPercent: '2.8',
    engagementRate: '6.4',
    hookRate: '78',
    performanceTier: 'TOP' as const,
    heatmapZones: [
      { startPct: 0, endPct: 20, type: 'hook', label: 'Attention Hook' },
      { startPct: 35, endPct: 65, type: 'proof', label: 'Social Proof' },
      { startPct: 75, endPct: 100, type: 'cta', label: 'Call to Action' },
    ],
    transcript: [
      { timeSec: '0', text: 'POV: You finally found the serum that actually works.' },
      { timeSec: '3', text: '3 weeks of consistent use equals this glow.' },
      { timeSec: '7', text: 'Formulated with 20% Vitamin C plus Hyaluronic Acid.' },
      { timeSec: '11', text: 'First order 20% off. Shop now.' },
    ],
  },
  {
    title: 'Overnight Hydration Mask — Beauty Editors Are Obsessed',
    brand: 'GlowMask Beauty',
    platform: 'META' as const,
    category: 'Skincare',
    thumbnailUrl:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerEscapes.jpg',
    videoUrl:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    duration: 22,
    spendCents: '2200000',
    impressions: '1100000',
    ctrPercent: '3.2',
    engagementRate: '7.1',
    hookRate: '82',
    performanceTier: 'HIGH' as const,
    heatmapZones: [
      { startPct: 0, endPct: 15, type: 'hook', label: 'Pattern Interrupt' },
      { startPct: 20, endPct: 70, type: 'proof', label: 'Before/After' },
      { startPct: 80, endPct: 100, type: 'cta', label: 'Risk-Free Offer' },
    ],
    transcript: [
      { timeSec: '0', text: 'I put this on at 10pm...' },
      { timeSec: '3', text: '...and woke up with the smoothest skin of my life.' },
      { timeSec: '8', text: 'The overnight hydration mask that beauty editors are obsessed with.' },
      { timeSec: '15', text: 'Try it risk-free with our 30-day money-back guarantee.' },
    ],
  },
  {
    title: 'Clinical-Grade Retinol — 47% Fewer Fine Lines in 8 Weeks',
    brand: 'DermaFix Pro',
    platform: 'META' as const,
    category: 'Skincare',
    thumbnailUrl:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerJoyrides.jpg',
    videoUrl:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
    duration: 30,
    spendCents: '8900000',
    impressions: '4200000',
    ctrPercent: '1.9',
    engagementRate: '4.2',
    hookRate: '65',
    performanceTier: 'TOP' as const,
    heatmapZones: [
      { startPct: 0, endPct: 25, type: 'hook', label: 'Bold Claim' },
      { startPct: 30, endPct: 70, type: 'proof', label: 'Clinical Data' },
      { startPct: 75, endPct: 100, type: 'cta', label: 'Learn More' },
    ],
    transcript: [
      { timeSec: '0', text: 'Dermatologist-developed. Clinically proven.' },
      { timeSec: '4', text: 'Our retinol serum reduces fine lines by 47% in 8 weeks.' },
      { timeSec: '12', text: 'Join 200,000 women who trust DermaFix.' },
      { timeSec: '22', text: 'Learn more about clinical-grade skincare.' },
    ],
  },
  {
    title: '25g Protein, Zero Bloat — Actually Tastes Good',
    brand: 'ProteinPeak',
    platform: 'TIKTOK' as const,
    category: 'Fitness',
    thumbnailUrl:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerFun.jpg',
    videoUrl:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    duration: 30,
    spendCents: '1800000',
    impressions: '5600000',
    ctrPercent: '4.1',
    engagementRate: '9.3',
    hookRate: '88',
    performanceTier: 'TOP' as const,
    heatmapZones: [
      { startPct: 0, endPct: 20, type: 'hook', label: 'Problem Callout' },
      { startPct: 25, endPct: 65, type: 'proof', label: 'Product Demo' },
      { startPct: 70, endPct: 100, type: 'cta', label: 'Risk Reversal' },
    ],
    transcript: [
      { timeSec: '0', text: '25g protein, zero bloat, actually tastes good.' },
      { timeSec: '5', text: 'Our chocolate fudge flavor just dropped.' },
      { timeSec: '12', text: 'Here is what 30 days of consistent use looks like.' },
      { timeSec: '22', text: 'Try it risk-free with our 30-day money-back guarantee.' },
    ],
  },
  {
    title: 'These Resistance Bands Replaced My Entire Gym Setup',
    brand: 'FitLife Gear',
    platform: 'META' as const,
    category: 'Fitness',
    thumbnailUrl:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/images/ForBiggerMeltdowns.jpg',
    videoUrl:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
    duration: 45,
    spendCents: '850000',
    impressions: '620000',
    ctrPercent: '2.1',
    engagementRate: '5.8',
    hookRate: '71',
    performanceTier: 'HIGH' as const,
    heatmapZones: [
      { startPct: 0, endPct: 22, type: 'hook', label: 'Bold Claim' },
      { startPct: 30, endPct: 75, type: 'proof', label: 'Social Proof' },
      { startPct: 80, endPct: 100, type: 'cta', label: 'Get Yours' },
    ],
    transcript: [
      { timeSec: '0', text: 'These resistance bands replaced my entire gym setup.' },
      { timeSec: '8', text: '5 resistance levels, anti-snap latex, lifetime warranty.' },
      { timeSec: '20', text: 'Over 50,000 home athletes trust FitLife.' },
      { timeSec: '35', text: 'Build strength anywhere. Get yours today.' },
    ],
  },
  {
    title: 'Clean Pre-Workout Energy — No Crash, No Fillers',
    brand: 'SportsFuel',
    platform: 'META' as const,
    category: 'Fitness',
    thumbnailUrl:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/images/SubaruOutbackOnStreetAndDirt.jpg',
    videoUrl:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    duration: 45,
    spendCents: '6700000',
    impressions: '3100000',
    ctrPercent: '1.6',
    engagementRate: '3.9',
    hookRate: '59',
    performanceTier: 'MID' as const,
    heatmapZones: [
      { startPct: 0, endPct: 20, type: 'hook', label: 'Curiosity Gap' },
      { startPct: 25, endPct: 60, type: 'proof', label: 'Comparison' },
      { startPct: 65, endPct: 100, type: 'cta', label: 'Start Trial' },
    ],
    transcript: [
      { timeSec: '0', text: 'Clean energy without the crash.' },
      { timeSec: '6', text: 'No artificial sweeteners, no proprietary blends.' },
      { timeSec: '18', text: '200mg natural caffeine plus B vitamins plus electrolytes.' },
      { timeSec: '32', text: 'Your pre-workout, simplified. Start your trial today.' },
    ],
  },
  {
    title: 'Charcoal Cleanser Deep Pore Clean Without Stripping',
    brand: 'CleanSkin Co',
    platform: 'TIKTOK' as const,
    category: 'Skincare',
    thumbnailUrl:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/images/WeAreGoingOnBullrun.jpg',
    videoUrl:
      'https://storage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
    duration: 18,
    spendCents: null,
    impressions: '890000',
    ctrPercent: '3.7',
    engagementRate: '8.2',
    hookRate: '74',
    performanceTier: 'HIGH' as const,
    heatmapZones: [
      { startPct: 0, endPct: 30, type: 'hook', label: 'POV Statement' },
      { startPct: 35, endPct: 75, type: 'proof', label: 'Demo' },
      { startPct: 80, endPct: 100, type: 'cta', label: 'Shop Now' },
    ],
    transcript: [
      { timeSec: '0', text: 'Our new charcoal cleanser is here.' },
      { timeSec: '4', text: 'Deep pore cleansing without stripping your skin\'s natural oils.' },
      { timeSec: '10', text: 'Watch the difference after just one use.' },
      { timeSec: '14', text: 'Shop now and get 20% off your first order.' },
    ],
  },
];

// ─── Seed function ─────────────────────────────────────────────────────────────

async function seedVideos(): Promise<void> {
  const pool = new Pool({ connectionString: env.DATABASE_URL });
  const db = drizzle(pool, { schema });

  console.log('🎬  Seeding videos...');

  const insertedVideoIds: string[] = [];

  for (const v of VIDEOS) {
    // Check if already exists (idempotent by title+brand)
    const existing = await db.query.videos.findFirst({
      where: and(eq(schema.videos.title, v.title), eq(schema.videos.brand, v.brand)),
    });

    let videoId: string;

    if (existing) {
      videoId = existing.id;
      console.log(`  ↩  Already exists: ${v.brand} — ${v.title.slice(0, 40)}`);
    } else {
      const { heatmapZones, transcript, ...videoData } = v;

      const [inserted] = await db
        .insert(schema.videos)
        .values(videoData)
        .returning({ id: schema.videos.id });

      videoId = inserted!.id;

      // Insert heatmap zones
      if (heatmapZones.length > 0) {
        await db
          .insert(schema.heatmapZones)
          .values(heatmapZones.map((z) => ({ ...z, videoId })));
      }

      // Insert transcript
      if (transcript.length > 0) {
        await db
          .insert(schema.transcriptSegments)
          .values(transcript.map((s) => ({ ...s, videoId })));
      }

      console.log(`  ✅  Inserted: ${v.brand} — ${v.title.slice(0, 40)}`);
    }

    insertedVideoIds.push(videoId);
  }

  // ── Seed sample briefs ────────────────────────────────────────────────────
  console.log('\n📋  Seeding briefs...');

  const BRIEFS = [
    {
      title: 'Skincare UGC — Q1 Campaign',
      campaign: 'LumiSkin Spring Launch',
      angle: 'Social Proof / Before-After',
      content:
        '# Skincare UGC Brief\n\n## Objective\nDrive first-purchase conversions for the Vitamin C Serum.\n\n## Hook Strategy\nOpen with a relatable POV moment. Viewer should see themselves in the first 3 seconds.\n\n## Key Messages\n- 20% Vitamin C + Hyaluronic Acid\n- Results in 3 weeks\n- 20% off first order\n\n## Tone\nAuthentic UGC, not polished. Real skin, real results.',
    },
    {
      title: 'Fitness Supplements — Unboxing Angle',
      campaign: 'ProteinPeak DTC Push',
      angle: 'UGC Unboxing + Taste Test',
      content:
        '# Fitness Supplements Brief\n\n## Objective\nConvert gym-goers who are skeptical of protein powder taste.\n\n## Hook Strategy\nLead with the taste/flavor angle — most protein ads skip this entirely.\n\n## Key Messages\n- 25g protein, zero bloat\n- Chocolate fudge flavor\n- 30-day money-back guarantee\n\n## Tone\nEnergetic, relatable, slightly irreverent.',
    },
  ];

  for (const brief of BRIEFS) {
    const existing = await db.query.userBriefs.findFirst({
      where: and(
        eq(schema.userBriefs.title, brief.title),
        eq(schema.userBriefs.ownerId, DEV_USER_ID),
      ),
    });

    if (existing) {
      console.log(`  ↩  Already exists: ${brief.title}`);
      continue;
    }

    const [inserted] = await db
      .insert(schema.userBriefs)
      .values({ ...brief, ownerId: DEV_USER_ID })
      .returning({ id: schema.userBriefs.id });

    // Add owner as collaborator
    await db.insert(schema.briefCollaborators).values({
      briefId: inserted!.id,
      userId: DEV_USER_ID,
      role: 'owner',
      acceptedAt: new Date(),
    });

    // Add first 2 videos as references for the first brief
    if (brief.title.includes('Skincare') && insertedVideoIds.length >= 2) {
      const skincareIds = insertedVideoIds.slice(0, 3);
      for (const vid of skincareIds) {
        await db
          .insert(schema.briefReferences)
          .values({ briefId: inserted!.id, videoId: vid, addedBy: DEV_USER_ID })
          .onConflictDoNothing();
      }
    }

    console.log(`  ✅  Inserted brief: ${brief.title}`);
  }

  console.log(`\n🎉  Done — ${VIDEOS.length} videos, ${BRIEFS.length} briefs seeded.`);
  await pool.end();
}

seedVideos().catch((err) => {
  console.error('Video seed failed:', err);
  process.exit(1);
});
