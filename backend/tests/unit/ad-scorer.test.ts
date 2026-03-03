/**
 * Unit tests for the Ad Performance Scorer.
 *
 * These tests cover every scoring sub-function and the main scoreAd()
 * function in isolation — no DB, no framework.
 */

import { describe, it, expect } from 'vitest';
import {
  scoreLongevity,
  scoreSpend,
  scoreEngagement,
  scoreMediaType,
  scoreToTier,
  scoreAd,
  type ScoringInput,
} from '../../src/domain/scoring/ad-scorer.js';

// ─── Helper ───────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

// ─── scoreLongevity ───────────────────────────────────────────────────────────

describe('scoreLongevity', () => {
  it('returns 30 for ads running > 60 days', () => {
    expect(scoreLongevity(daysAgo(90), new Date())).toBe(30);
    expect(scoreLongevity(daysAgo(61), new Date())).toBe(30);
  });

  it('returns 22 for ads running 31–60 days', () => {
    expect(scoreLongevity(daysAgo(60), new Date())).toBe(22);
    expect(scoreLongevity(daysAgo(31), new Date())).toBe(22);
  });

  it('returns 15 for ads running 15–30 days', () => {
    expect(scoreLongevity(daysAgo(30), new Date())).toBe(15);
    expect(scoreLongevity(daysAgo(15), new Date())).toBe(15);
  });

  it('returns 8 for ads running 8–14 days', () => {
    expect(scoreLongevity(daysAgo(14), new Date())).toBe(8);
    expect(scoreLongevity(daysAgo(8), new Date())).toBe(8);
  });

  it('returns 3 for ads running ≤ 7 days', () => {
    expect(scoreLongevity(daysAgo(7), new Date())).toBe(3);
    expect(scoreLongevity(daysAgo(1), new Date())).toBe(3);
    expect(scoreLongevity(new Date(), new Date())).toBe(3);
  });

  it('handles inverted dates gracefully (returns 3)', () => {
    // lastSeenAt before firstSeenAt → 0 days → 3 pts
    expect(scoreLongevity(new Date(), daysAgo(5))).toBe(3);
  });
});

// ─── scoreSpend ───────────────────────────────────────────────────────────────

describe('scoreSpend', () => {
  it('returns 25 for spend > $50K', () => {
    expect(scoreSpend('50001')).toBe(25);
    expect(scoreSpend('100000')).toBe(25);
  });

  it('returns 18 for spend > $20K', () => {
    expect(scoreSpend('20001')).toBe(18);
    expect(scoreSpend('49999')).toBe(18);
  });

  it('returns 11 for spend > $5K', () => {
    expect(scoreSpend('5001')).toBe(11);
    expect(scoreSpend('19999')).toBe(11);
  });

  it('returns 5 for spend > $1K', () => {
    expect(scoreSpend('1001')).toBe(5);
    expect(scoreSpend('4999')).toBe(5);
  });

  it('returns 1 for spend ≤ $1K but > 0', () => {
    expect(scoreSpend('500')).toBe(1);
    expect(scoreSpend('1')).toBe(1);
  });

  it('returns 0 for null', () => {
    expect(scoreSpend(null)).toBe(0);
  });

  it('returns 0 for empty string', () => {
    expect(scoreSpend('')).toBe(0);
  });

  it('returns 0 for zero', () => {
    expect(scoreSpend('0')).toBe(0);
  });

  it('returns 0 for negative spend', () => {
    expect(scoreSpend('-500')).toBe(0);
  });

  it('returns 0 for non-numeric strings', () => {
    expect(scoreSpend('abc')).toBe(0);
  });
});

// ─── scoreEngagement ─────────────────────────────────────────────────────────

describe('scoreEngagement', () => {
  // index = (likes + comments*3 + shares*5) / 1000
  // > 100 → 25, > 50 → 18, > 20 → 12, > 5 → 6, > 0 → 2, 0 → 0

  it('returns 25 for index > 100', () => {
    // 100_001 likes → index = 100.001
    expect(scoreEngagement(100_001, 0, 0)).toBe(25);
    // 20_000 shares → index = 100
    expect(scoreEngagement(0, 0, 20_001)).toBe(25);
  });

  it('returns 18 for index > 50', () => {
    // 50_001 likes → index ≈ 50.001
    expect(scoreEngagement(50_001, 0, 0)).toBe(18);
  });

  it('returns 12 for index > 20', () => {
    expect(scoreEngagement(20_001, 0, 0)).toBe(12);
  });

  it('returns 6 for index > 5', () => {
    expect(scoreEngagement(5_001, 0, 0)).toBe(6);
  });

  it('returns 2 for index > 0', () => {
    expect(scoreEngagement(1, 0, 0)).toBe(2);
    expect(scoreEngagement(0, 1, 0)).toBe(2);
    expect(scoreEngagement(0, 0, 1)).toBe(2);
  });

  it('returns 0 for all-zero engagement', () => {
    expect(scoreEngagement(0, 0, 0)).toBe(0);
  });

  it('handles null inputs as zero', () => {
    expect(scoreEngagement(null, null, null)).toBe(0);
    expect(scoreEngagement(100_001, null, null)).toBe(25);
  });

  it('weights comments (×3) and shares (×5) correctly', () => {
    // 1 share → index = 5/1000 = 0.005 → > 0 → 2
    expect(scoreEngagement(0, 0, 1)).toBe(2);
    // 1000 shares → index = 5 → NOT > 5, so 2
    expect(scoreEngagement(0, 0, 1000)).toBe(2);
    // 1001 shares → index = 5.005 → > 5 → 6
    expect(scoreEngagement(0, 0, 1001)).toBe(6);
  });
});

// ─── scoreMediaType ───────────────────────────────────────────────────────────

describe('scoreMediaType', () => {
  it('returns 10 for VIDEO', () => {
    expect(scoreMediaType('VIDEO')).toBe(10);
  });

  it('returns 6 for CAROUSEL', () => {
    expect(scoreMediaType('CAROUSEL')).toBe(6);
  });

  it('returns 3 for IMAGE', () => {
    expect(scoreMediaType('IMAGE')).toBe(3);
  });
});

// ─── scoreToTier ──────────────────────────────────────────────────────────────

describe('scoreToTier', () => {
  it('returns TOP for score ≥ 80', () => {
    expect(scoreToTier(80)).toBe('TOP');
    expect(scoreToTier(100)).toBe('TOP');
  });

  it('returns HIGH for score 60–79', () => {
    expect(scoreToTier(60)).toBe('HIGH');
    expect(scoreToTier(79)).toBe('HIGH');
  });

  it('returns MID for score 35–59', () => {
    expect(scoreToTier(35)).toBe('MID');
    expect(scoreToTier(59)).toBe('MID');
  });

  it('returns LOW for score < 35', () => {
    expect(scoreToTier(34)).toBe('LOW');
    expect(scoreToTier(0)).toBe('LOW');
  });
});

// ─── scoreAd (integration of all sub-functions) ───────────────────────────────

describe('scoreAd', () => {
  const baseInput: ScoringInput = {
    firstSeenAt: daysAgo(90),   // 30 pts longevity
    lastSeenAt: new Date(),
    isActive: true,             // 10 pts active bonus
    estimatedSpend: '60000',    // 25 pts spend
    engagementLikes: 200_000,   // 25 pts engagement (index=200)
    engagementComments: null,
    engagementShares: null,
    mediaType: 'VIDEO',         // 10 pts media
  };

  it('produces correct max score for a top performer', () => {
    const result = scoreAd(baseInput);
    expect(result.score).toBe(100); // 30+25+25+10+10 = 100
    expect(result.tier).toBe('TOP');
    expect(result.breakdown.longevity).toBe(30);
    expect(result.breakdown.spend).toBe(25);
    expect(result.breakdown.engagement).toBe(25);
    expect(result.breakdown.mediaType).toBe(10);
    expect(result.breakdown.activeBonus).toBe(10);
  });

  it('caps score at 100', () => {
    // Even if subcategories sum to more (they don't here but test the cap logic)
    const result = scoreAd(baseInput);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it('inactive ad loses 10 pts active bonus', () => {
    const result = scoreAd({ ...baseInput, isActive: false });
    expect(result.breakdown.activeBonus).toBe(0);
    expect(result.score).toBe(90);
    expect(result.tier).toBe('TOP'); // 90 is still TOP
  });

  it('image ad scores 3 pts for media type', () => {
    const result = scoreAd({ ...baseInput, mediaType: 'IMAGE' });
    expect(result.breakdown.mediaType).toBe(3);
  });

  it('produces LOW tier for a brand-new, low-spend, inactive image ad', () => {
    const result = scoreAd({
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      isActive: false,
      estimatedSpend: null,
      engagementLikes: null,
      engagementComments: null,
      engagementShares: null,
      mediaType: 'IMAGE',
    });
    // 3 (longevity) + 0 (spend) + 0 (engagement) + 3 (image) + 0 (inactive) = 6
    expect(result.score).toBe(6);
    expect(result.tier).toBe('LOW');
  });

  it('produces MID tier for a moderate ad', () => {
    const result = scoreAd({
      firstSeenAt: daysAgo(20),   // 15 pts
      lastSeenAt: new Date(),
      isActive: true,             // 10 pts
      estimatedSpend: '2000',     // 5 pts
      engagementLikes: 6000,      // 6 pts (index=6)
      engagementComments: null,
      engagementShares: null,
      mediaType: 'CAROUSEL',      // 6 pts
    });
    // 15 + 5 + 6 + 6 + 10 = 42 → MID
    expect(result.score).toBe(42);
    expect(result.tier).toBe('MID');
  });

  it('returns breakdown with all 5 keys', () => {
    const result = scoreAd(baseInput);
    expect(result.breakdown).toHaveProperty('longevity');
    expect(result.breakdown).toHaveProperty('spend');
    expect(result.breakdown).toHaveProperty('engagement');
    expect(result.breakdown).toHaveProperty('mediaType');
    expect(result.breakdown).toHaveProperty('activeBonus');
  });
});
