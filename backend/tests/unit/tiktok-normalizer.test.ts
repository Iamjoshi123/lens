/**
 * Unit tests for the TikTok Ad Normalizer.
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeTikTokAd,
  normalizeTikTokAdBatch,
  type RawTikTokAdExtraction,
} from '../../src/domain/normalization/ad-normalizer.js';

const SOURCE_URL = 'https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en';

// ─── normalizeTikTokAd ────────────────────────────────────────────────────────

describe('normalizeTikTokAd', () => {
  const validRaw: RawTikTokAdExtraction = {
    adId: 'tt-123456',
    advertiserName: 'GlowSkin Beauty',
    adCaption: 'Our #1 serum for glowing skin — try it risk free!',
    thumbnailUrl: 'https://p16.tiktokcdn.com/thumb/abc.jpg',
    videoUrl: 'https://p16.tiktokcdn.com/video/abc.mp4',
    ctaText: 'Shop Now',
    landingPageUrl: 'https://glowskin.com/serum',
    industry: 'Beauty & Personal Care',
    objective: 'Conversions',
    likes: 42000,
    views: 1200000,
    durationSec: 15,
  };

  it('normalizes a complete TikTok ad correctly', () => {
    const result = normalizeTikTokAd(validRaw, SOURCE_URL);
    expect(result).not.toBeNull();
    expect(result!.platform).toBe('TIKTOK');
    expect(result!.brandName).toBe('GlowSkin Beauty');
    expect(result!.adCopy).toBe('Our #1 serum for glowing skin — try it risk free!');
    expect(result!.externalId).toBe('tt-123456');
    expect(result!.ctaText).toBe('Shop Now');
    expect(result!.landingPageUrl).toBe('https://glowskin.com/serum');
    expect(result!.mediaType).toBe('VIDEO');
    expect(result!.videoDurationSec).toBe(15);
    expect(result!.isActive).toBe(true);
    expect(result!.sourceUrl).toBe(SOURCE_URL);
  });

  it('includes both thumbnail and video URLs in mediaUrls', () => {
    const result = normalizeTikTokAd(validRaw, SOURCE_URL);
    expect(result!.mediaUrls).toContain('https://p16.tiktokcdn.com/thumb/abc.jpg');
    expect(result!.mediaUrls).toContain('https://p16.tiktokcdn.com/video/abc.mp4');
  });

  it('returns null when advertiserName is missing', () => {
    expect(normalizeTikTokAd({ advertiserName: '' }, SOURCE_URL)).toBeNull();
    expect(normalizeTikTokAd({ advertiserName: '   ' }, SOURCE_URL)).toBeNull();
  });

  it('falls back to placeholder adCopy when caption is missing', () => {
    const result = normalizeTikTokAd({ advertiserName: 'BrandX' }, SOURCE_URL);
    expect(result).not.toBeNull();
    expect(result!.adCopy).toContain('BrandX');
  });

  it('sets brandLogoUrl to null (TikTok does not expose logo URL)', () => {
    const result = normalizeTikTokAd(validRaw, SOURCE_URL);
    expect(result!.brandLogoUrl).toBeNull();
  });

  it('sets headline to null (TikTok has no separate headline field)', () => {
    const result = normalizeTikTokAd(validRaw, SOURCE_URL);
    expect(result!.headline).toBeNull();
  });

  it('ignores invalid thumbnail URLs', () => {
    const raw: RawTikTokAdExtraction = {
      ...validRaw,
      thumbnailUrl: 'not-a-url',
      videoUrl: undefined,
    };
    const result = normalizeTikTokAd(raw, SOURCE_URL);
    expect(result!.mediaUrls).toHaveLength(0);
  });

  it('ignores invalid landing page URLs', () => {
    const result = normalizeTikTokAd(
      { ...validRaw, landingPageUrl: 'not a url at all' },
      SOURCE_URL,
    );
    expect(result!.landingPageUrl).toBeNull();
  });

  it('generates a deterministic content hash', () => {
    const a = normalizeTikTokAd(validRaw, SOURCE_URL);
    const b = normalizeTikTokAd(validRaw, SOURCE_URL);
    expect(a!.contentHash).toBe(b!.contentHash);
  });

  it('generates a different hash for different brand + caption combos', () => {
    const a = normalizeTikTokAd(validRaw, SOURCE_URL);
    const b = normalizeTikTokAd({ ...validRaw, advertiserName: 'OtherBrand' }, SOURCE_URL);
    expect(a!.contentHash).not.toBe(b!.contentHash);
  });

  it('handles missing optional fields gracefully', () => {
    const minimal: RawTikTokAdExtraction = { advertiserName: 'Minimal Brand' };
    const result = normalizeTikTokAd(minimal, SOURCE_URL);
    expect(result).not.toBeNull();
    expect(result!.externalId).toBeNull();
    expect(result!.ctaText).toBeNull();
    expect(result!.landingPageUrl).toBeNull();
    expect(result!.videoDurationSec).toBeNull();
    expect(result!.mediaUrls).toHaveLength(0);
  });
});

// ─── normalizeTikTokAdBatch ───────────────────────────────────────────────────

describe('normalizeTikTokAdBatch', () => {
  it('filters out invalid entries', () => {
    const raw: RawTikTokAdExtraction[] = [
      { advertiserName: 'Valid Brand', adCaption: 'Great product' },
      { advertiserName: '' }, // invalid — no name
      { advertiserName: 'Another Brand', adCaption: 'Another ad' },
    ];
    const result = normalizeTikTokAdBatch(raw, SOURCE_URL);
    expect(result).toHaveLength(2);
  });

  it('deduplicates by content hash within the batch', () => {
    const raw: RawTikTokAdExtraction[] = [
      { advertiserName: 'Brand A', adCaption: 'Same copy' },
      { advertiserName: 'Brand A', adCaption: 'Same copy' }, // duplicate
      { advertiserName: 'Brand A', adCaption: 'Different copy' },
    ];
    const result = normalizeTikTokAdBatch(raw, SOURCE_URL);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(normalizeTikTokAdBatch([], SOURCE_URL)).toEqual([]);
  });

  it('returns empty array when all entries are invalid', () => {
    const raw: RawTikTokAdExtraction[] = [
      { advertiserName: '' },
      { advertiserName: '  ' },
    ];
    expect(normalizeTikTokAdBatch(raw, SOURCE_URL)).toHaveLength(0);
  });

  it('all results have platform=TIKTOK', () => {
    const raw: RawTikTokAdExtraction[] = [
      { advertiserName: 'Brand A', adCaption: 'Ad copy A' },
      { advertiserName: 'Brand B', adCaption: 'Ad copy B' },
    ];
    const results = normalizeTikTokAdBatch(raw, SOURCE_URL);
    expect(results.every((r) => r.platform === 'TIKTOK')).toBe(true);
  });

  it('all results have mediaType=VIDEO', () => {
    const raw: RawTikTokAdExtraction[] = [
      { advertiserName: 'Brand A', adCaption: 'Ad copy A' },
    ];
    const results = normalizeTikTokAdBatch(raw, SOURCE_URL);
    expect(results.every((r) => r.mediaType === 'VIDEO')).toBe(true);
  });
});
