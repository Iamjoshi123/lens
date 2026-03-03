/**
 * Unit tests for ad normalizer — pure domain logic, no mocks needed.
 */

import { describe, it, expect } from 'vitest';
import {
  normalizeMetaAd,
  normalizeMetaAdBatch,
  generateContentHash,
  type RawMetaAdExtraction,
} from '../../src/domain/normalization/ad-normalizer.js';

describe('generateContentHash', () => {
  it('produces a deterministic 16-char hex hash', () => {
    const hash = generateContentHash('LumiSkin', 'Great serum for your skin');
    expect(hash).toHaveLength(16);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it('is case-insensitive', () => {
    const a = generateContentHash('LumiSkin', 'Great serum');
    const b = generateContentHash('lumiskin', 'great serum');
    expect(a).toBe(b);
  });

  it('trims whitespace', () => {
    const a = generateContentHash('LumiSkin', 'Great serum');
    const b = generateContentHash('  LumiSkin  ', '  Great serum  ');
    expect(a).toBe(b);
  });

  it('produces different hashes for different content', () => {
    const a = generateContentHash('LumiSkin', 'Product A');
    const b = generateContentHash('LumiSkin', 'Product B');
    expect(a).not.toBe(b);
  });

  it('produces different hashes for different brands', () => {
    const a = generateContentHash('Brand A', 'Same copy');
    const b = generateContentHash('Brand B', 'Same copy');
    expect(a).not.toBe(b);
  });
});

describe('normalizeMetaAd', () => {
  const validRaw: RawMetaAdExtraction = {
    adLibraryId: 'fb_123',
    pageName: 'LumiSkin',
    pageLogoUrl: 'https://example.com/logo.jpg',
    adText: 'Great vitamin C serum for your skin',
    headline: 'Shop Now',
    ctaButtonText: 'Learn More',
    linkUrl: 'https://lumiskin.com/serum',
    mediaType: 'video',
    imageUrls: ['https://example.com/thumb.jpg'],
    isActive: true,
    startedRunning: '2026-01-15',
  };

  it('normalizes a valid Meta ad extraction', () => {
    const result = normalizeMetaAd(validRaw, 'https://facebook.com/ads/library');
    expect(result).not.toBeNull();
    expect(result!.platform).toBe('META');
    expect(result!.brandName).toBe('LumiSkin');
    expect(result!.adCopy).toBe('Great vitamin C serum for your skin');
    expect(result!.externalId).toBe('fb_123');
    expect(result!.mediaType).toBe('VIDEO');
    expect(result!.headline).toBe('Shop Now');
    expect(result!.ctaText).toBe('Learn More');
    expect(result!.landingPageUrl).toBe('https://lumiskin.com/serum');
    expect(result!.mediaUrls).toEqual(['https://example.com/thumb.jpg']);
    expect(result!.isActive).toBe(true);
    expect(result!.contentHash).toHaveLength(16);
  });

  it('returns null for empty brand name', () => {
    const result = normalizeMetaAd({ ...validRaw, pageName: '' }, 'url');
    expect(result).toBeNull();
  });

  it('returns null for whitespace-only brand name', () => {
    const result = normalizeMetaAd({ ...validRaw, pageName: '   ' }, 'url');
    expect(result).toBeNull();
  });

  it('returns null for empty ad text', () => {
    const result = normalizeMetaAd({ ...validRaw, adText: '' }, 'url');
    expect(result).toBeNull();
  });

  it('defaults mediaType to IMAGE when missing', () => {
    const result = normalizeMetaAd({ ...validRaw, mediaType: undefined }, 'url');
    expect(result!.mediaType).toBe('IMAGE');
  });

  it('maps "carousel" to CAROUSEL', () => {
    const result = normalizeMetaAd({ ...validRaw, mediaType: 'carousel' }, 'url');
    expect(result!.mediaType).toBe('CAROUSEL');
  });

  it('filters out invalid URLs from imageUrls', () => {
    const result = normalizeMetaAd(
      { ...validRaw, imageUrls: ['https://valid.com/img.jpg', 'not-a-url', 'ftp://'] },
      'url',
    );
    expect(result!.mediaUrls).toEqual(['https://valid.com/img.jpg']);
  });

  it('nullifies invalid landing page URLs', () => {
    const result = normalizeMetaAd(
      { ...validRaw, linkUrl: 'not-a-valid-url' },
      'url',
    );
    expect(result!.landingPageUrl).toBeNull();
  });

  it('handles missing optional fields gracefully', () => {
    const minimal: RawMetaAdExtraction = {
      pageName: 'BrandX',
      adText: 'Buy our product',
    };
    const result = normalizeMetaAd(minimal, 'url');
    expect(result).not.toBeNull();
    expect(result!.externalId).toBeNull();
    expect(result!.headline).toBeNull();
    expect(result!.ctaText).toBeNull();
    expect(result!.landingPageUrl).toBeNull();
    expect(result!.mediaUrls).toEqual([]);
    expect(result!.mediaType).toBe('IMAGE');
    expect(result!.isActive).toBe(true);
  });

  it('parses startedRunning date', () => {
    const result = normalizeMetaAd(
      { ...validRaw, startedRunning: '2025-12-25' },
      'url',
    );
    expect(result!.firstSeenAt.toISOString()).toContain('2025-12-25');
  });

  it('defaults firstSeenAt to now when startedRunning is missing', () => {
    const before = Date.now();
    const result = normalizeMetaAd(
      { ...validRaw, startedRunning: undefined },
      'url',
    );
    expect(result!.firstSeenAt.getTime()).toBeGreaterThanOrEqual(before);
  });

  it('stores raw extraction data for debugging', () => {
    const result = normalizeMetaAd(validRaw, 'url');
    expect(result!.rawScrapedData).toBe(validRaw);
  });
});

describe('normalizeMetaAdBatch', () => {
  it('normalizes an array and filters out invalid entries', () => {
    const rawAds: RawMetaAdExtraction[] = [
      { pageName: 'Brand A', adText: 'Valid ad copy' },
      { pageName: '', adText: '' }, // invalid — should be filtered
      { pageName: 'Brand B', adText: 'Another valid ad' },
    ];

    const results = normalizeMetaAdBatch(rawAds, 'https://facebook.com/ads/library');
    expect(results).toHaveLength(2);
    expect(results[0]!.brandName).toBe('Brand A');
    expect(results[1]!.brandName).toBe('Brand B');
  });

  it('deduplicates within the batch by content hash', () => {
    const rawAds: RawMetaAdExtraction[] = [
      { pageName: 'LumiSkin', adText: 'Same copy' },
      { pageName: 'LumiSkin', adText: 'Same copy' }, // duplicate
      { pageName: 'LumiSkin', adText: 'Different copy' },
    ];

    const results = normalizeMetaAdBatch(rawAds, 'url');
    expect(results).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(normalizeMetaAdBatch([], 'url')).toEqual([]);
  });

  it('handles fixture data correctly', async () => {
    const fixture = await import('../fixtures/meta-ad-library-response.json', {
      with: { type: 'json' },
    });
    const rawAds = fixture.default.extract.ads as RawMetaAdExtraction[];
    const results = normalizeMetaAdBatch(rawAds, fixture.default.metadata.sourceURL);

    // Fixture has 5 ads: 3 valid, 1 empty (filtered), 1 with bad URL (still valid)
    expect(results.length).toBeGreaterThanOrEqual(3);
    expect(results.length).toBeLessThanOrEqual(4);

    // All results should have required fields
    for (const ad of results) {
      expect(ad.brandName.length).toBeGreaterThan(0);
      expect(ad.adCopy.length).toBeGreaterThan(0);
      expect(ad.contentHash).toHaveLength(16);
      expect(ad.platform).toBe('META');
    }
  });
});
