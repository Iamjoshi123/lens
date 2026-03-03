/**
 * Ad Performance Scorer
 *
 * Pure domain logic — no framework imports, fully unit-testable.
 *
 * Scoring model (0–100):
 *
 *   Longevity   (30 pts max) — days the ad has been running
 *     > 60 days = 30, > 30 = 22, > 14 = 15, > 7 = 8, ≤ 7 = 3
 *
 *   Spend       (25 pts max) — estimated spend signals advertiser confidence
 *     > $50K = 25, > $20K = 18, > $5K = 11, > $1K = 5, null/0 = 0
 *
 *   Engagement  (25 pts max) — likes + comments + shares relative to spend proxy
 *     Raw engagement index = (likes + comments*3 + shares*5) / 1000
 *     > 100 = 25, > 50 = 18, > 20 = 12, > 5 = 6, ≤ 5 = 0
 *
 *   Media type  (10 pts max) — video ads outperform on average
 *     VIDEO = 10, CAROUSEL = 6, IMAGE = 3
 *
 *   Active bonus (10 pts) — still running = not turned off by advertiser
 *     isActive = true → +10, false → 0
 *
 * Tiers:
 *   TOP  ≥ 80
 *   HIGH ≥ 60
 *   MID  ≥ 35
 *   LOW  < 35
 */

export type PerformanceTier = 'TOP' | 'HIGH' | 'MID' | 'LOW';

export interface ScoringInput {
  firstSeenAt: Date;
  lastSeenAt: Date;
  isActive: boolean;
  estimatedSpend: string | null; // stored as numeric string (dollars)
  engagementLikes: number | null;
  engagementComments: number | null;
  engagementShares: number | null;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
}

export interface ScoringResult {
  score: number;       // 0–100
  tier: PerformanceTier;
  breakdown: {
    longevity: number;
    spend: number;
    engagement: number;
    mediaType: number;
    activeBonus: number;
  };
}

// ─── Scoring sub-functions (exported for unit testing) ────────────────────────

export function scoreLongevity(firstSeenAt: Date, lastSeenAt: Date): number {
  const days = Math.max(
    0,
    (lastSeenAt.getTime() - firstSeenAt.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (days > 60) return 30;
  if (days > 30) return 22;
  if (days > 14) return 15;
  if (days > 7) return 8;
  return 3;
}

export function scoreSpend(estimatedSpend: string | null): number {
  if (!estimatedSpend) return 0;
  const dollars = Number(estimatedSpend);
  if (isNaN(dollars) || dollars <= 0) return 0;
  if (dollars > 50_000) return 25;
  if (dollars > 20_000) return 18;
  if (dollars > 5_000) return 11;
  if (dollars > 1_000) return 5;
  return 1;
}

export function scoreEngagement(
  likes: number | null,
  comments: number | null,
  shares: number | null,
): number {
  const l = likes ?? 0;
  const c = comments ?? 0;
  const s = shares ?? 0;
  const index = (l + c * 3 + s * 5) / 1000;
  if (index > 100) return 25;
  if (index > 50) return 18;
  if (index > 20) return 12;
  if (index > 5) return 6;
  if (index > 0) return 2;
  return 0;
}

export function scoreMediaType(mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL'): number {
  if (mediaType === 'VIDEO') return 10;
  if (mediaType === 'CAROUSEL') return 6;
  return 3;
}

// ─── Main scorer ──────────────────────────────────────────────────────────────

export function scoreAd(input: ScoringInput): ScoringResult {
  const longevity = scoreLongevity(input.firstSeenAt, input.lastSeenAt);
  const spend = scoreSpend(input.estimatedSpend);
  const engagement = scoreEngagement(
    input.engagementLikes,
    input.engagementComments,
    input.engagementShares,
  );
  const mediaTypePts = scoreMediaType(input.mediaType);
  const activeBonus = input.isActive ? 10 : 0;

  const score = Math.min(
    100,
    longevity + spend + engagement + mediaTypePts + activeBonus,
  );

  const tier = scoreToTier(score);

  return {
    score,
    tier,
    breakdown: {
      longevity,
      spend,
      engagement,
      mediaType: mediaTypePts,
      activeBonus,
    },
  };
}

export function scoreToTier(score: number): PerformanceTier {
  if (score >= 80) return 'TOP';
  if (score >= 60) return 'HIGH';
  if (score >= 35) return 'MID';
  return 'LOW';
}
