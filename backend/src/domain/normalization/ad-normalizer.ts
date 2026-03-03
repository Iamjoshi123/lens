/**
 * Pure domain logic for normalizing raw Firecrawl extraction data
 * into our Ad schema. No framework imports — fully unit-testable.
 */

import { createHash } from 'node:crypto';

// ─── Types for raw extracted data ─────────────────────────────────────────────

/** Shape of a single ad extracted by Firecrawl LLM from Meta Ad Library */
export interface RawMetaAdExtraction {
  adLibraryId?: string;
  pageName: string;
  pageLogoUrl?: string;
  adText: string;
  headline?: string;
  ctaButtonText?: string;
  linkUrl?: string;
  mediaType?: 'image' | 'video' | 'carousel';
  imageUrls?: string[];
  isActive?: boolean;
  startedRunning?: string;
}

/** Shape of the full extraction result from Firecrawl (Meta) */
export interface MetaAdExtractionResult {
  ads: RawMetaAdExtraction[];
}

/** Shape of a single ad extracted by Firecrawl LLM from TikTok Creative Center */
export interface RawTikTokAdExtraction {
  adId?: string;
  advertiserName: string;
  adCaption?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  ctaText?: string;
  landingPageUrl?: string;
  industry?: string;
  objective?: string;
  likes?: number;
  views?: number;
  durationSec?: number;
}

/** Shape of the full extraction result from Firecrawl (TikTok) */
export interface TikTokAdExtractionResult {
  ads: RawTikTokAdExtraction[];
}

/** Normalized ad ready for DB insertion */
export interface NormalizedAd {
  externalId: string | null;
  contentHash: string;
  platform: 'META' | 'TIKTOK' | 'YOUTUBE';
  brandName: string;
  brandLogoUrl: string | null;
  adCopy: string;
  headline: string | null;
  ctaText: string | null;
  landingPageUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  mediaUrls: string[];
  videoDurationSec: number | null;
  isActive: boolean;
  sourceUrl: string;
  firstSeenAt: Date;
  lastSeenAt: Date;
  rawScrapedData: unknown;
}

// ─── Content hash ─────────────────────────────────────────────────────────────

/**
 * Generate a deterministic hash from brand name + ad copy for deduplication.
 * Two ads with the same brand and copy are considered the same ad.
 */
export function generateContentHash(brandName: string, adCopy: string): string {
  const input = `${brandName.toLowerCase().trim()}::${adCopy.toLowerCase().trim()}`;
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

// ─── Media type mapping ──────────────────────────────────────────────────────

function normalizeMediaType(raw?: string): 'IMAGE' | 'VIDEO' | 'CAROUSEL' {
  if (!raw) return 'IMAGE';
  const lower = raw.toLowerCase();
  if (lower === 'video') return 'VIDEO';
  if (lower === 'carousel') return 'CAROUSEL';
  return 'IMAGE';
}

// ─── URL validation ──────────────────────────────────────────────────────────

function isValidUrl(value: string | undefined | null): boolean {
  if (!value) return false;
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

function cleanUrl(value: string | undefined | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return isValidUrl(trimmed) ? trimmed : null;
}

// ─── Normalizer ──────────────────────────────────────────────────────────────

/**
 * Normalize a single raw Meta Ad Library extraction into our Ad schema.
 * Handles missing/malformed data gracefully — never throws.
 */
export function normalizeMetaAd(
  raw: RawMetaAdExtraction,
  sourceUrl: string,
): NormalizedAd | null {
  // Minimum required fields: brand name + ad copy
  if (!raw.pageName?.trim() || !raw.adText?.trim()) {
    return null;
  }

  const brandName = raw.pageName.trim();
  const adCopy = raw.adText.trim();

  return {
    externalId: raw.adLibraryId?.trim() || null,
    contentHash: generateContentHash(brandName, adCopy),
    platform: 'META',
    brandName,
    brandLogoUrl: cleanUrl(raw.pageLogoUrl),
    adCopy,
    headline: raw.headline?.trim() || null,
    ctaText: raw.ctaButtonText?.trim() || null,
    landingPageUrl: cleanUrl(raw.linkUrl),
    mediaType: normalizeMediaType(raw.mediaType),
    mediaUrls: (raw.imageUrls ?? []).filter(isValidUrl),
    videoDurationSec: null,
    isActive: raw.isActive ?? true,
    sourceUrl,
    firstSeenAt: raw.startedRunning ? new Date(raw.startedRunning) : new Date(),
    lastSeenAt: new Date(),
    rawScrapedData: raw,
  };
}

/**
 * Normalize an array of raw extractions. Filters out invalid entries
 * and deduplicates by content hash within the batch.
 */
export function normalizeMetaAdBatch(
  rawAds: RawMetaAdExtraction[],
  sourceUrl: string,
): NormalizedAd[] {
  const seen = new Set<string>();
  const results: NormalizedAd[] = [];

  for (const raw of rawAds) {
    const normalized = normalizeMetaAd(raw, sourceUrl);
    if (!normalized) continue;

    // Deduplicate within this batch
    if (seen.has(normalized.contentHash)) continue;
    seen.add(normalized.contentHash);

    results.push(normalized);
  }

  return results;
}

// ─── TikTok normalizer ────────────────────────────────────────────────────────

/**
 * Normalize a single raw TikTok Creative Center extraction into our Ad schema.
 * TikTok ads are always VIDEO type. Caption is used as adCopy.
 */
export function normalizeTikTokAd(
  raw: RawTikTokAdExtraction,
  sourceUrl: string,
): NormalizedAd | null {
  // Minimum required field: advertiser name
  if (!raw.advertiserName?.trim()) return null;

  const brandName = raw.advertiserName.trim();
  // Use caption as ad copy; fall back to a placeholder if missing
  const adCopy = raw.adCaption?.trim() || `[TikTok video ad by ${brandName}]`;

  const mediaUrls: string[] = [];
  if (raw.thumbnailUrl && isValidUrl(raw.thumbnailUrl)) {
    mediaUrls.push(raw.thumbnailUrl);
  }
  if (raw.videoUrl && isValidUrl(raw.videoUrl)) {
    mediaUrls.push(raw.videoUrl);
  }

  return {
    externalId: raw.adId?.trim() || null,
    contentHash: generateContentHash(brandName, adCopy),
    platform: 'TIKTOK',
    brandName,
    brandLogoUrl: null,
    adCopy,
    headline: null,
    ctaText: raw.ctaText?.trim() || null,
    landingPageUrl: cleanUrl(raw.landingPageUrl),
    mediaType: 'VIDEO', // TikTok Creative Center only shows video ads
    mediaUrls,
    videoDurationSec: raw.durationSec ?? null,
    isActive: true, // Creative Center only shows active / top-performing ads
    sourceUrl,
    firstSeenAt: new Date(),
    lastSeenAt: new Date(),
    rawScrapedData: raw,
  };
}

/**
 * Normalize a batch of raw TikTok extractions.
 * Filters invalid entries and deduplicates by content hash.
 */
export function normalizeTikTokAdBatch(
  rawAds: RawTikTokAdExtraction[],
  sourceUrl: string,
): NormalizedAd[] {
  const seen = new Set<string>();
  const results: NormalizedAd[] = [];

  for (const raw of rawAds) {
    const normalized = normalizeTikTokAd(raw, sourceUrl);
    if (!normalized) continue;

    if (seen.has(normalized.contentHash)) continue;
    seen.add(normalized.contentHash);

    results.push(normalized);
  }

  return results;
}
