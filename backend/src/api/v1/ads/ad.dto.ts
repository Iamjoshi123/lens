/**
 * Ad response DTOs — maps internal Ad entity to API response.
 * Never exposes: raw_scraped_data, consecutive_miss_count, content_hash.
 * Adds computed field: daysActive.
 */

import type { Ad } from '../../../data/schema.js';

export interface AdResponseDto {
  id: string;
  externalId: string | null;
  platform: 'META' | 'TIKTOK' | 'YOUTUBE';
  brandName: string;
  brandLogoUrl: string | null;
  adCopy: string;
  headline: string | null;
  ctaText: string | null;
  landingPageUrl: string | null;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  mediaUrls: string[];
  screenshotUrl: string | null;
  videoDurationSec: number | null;
  firstSeenAt: string;
  lastSeenAt: string;
  isActive: boolean;
  daysActive: number;
  estimatedSpend: string | null;
  engagementLikes: number | null;
  engagementComments: number | null;
  engagementShares: number | null;
  sourceUrl: string | null;
  performanceTier: 'TOP' | 'HIGH' | 'MID' | 'LOW' | null;
  performanceScore: number | null;
  landingPage: {
    title: string | null;
    headline: string | null;
    offer: string | null;
    screenshotUrl: string | null;
  } | null;
}

function computeDaysActive(firstSeenAt: Date, lastSeenAt: Date): number {
  const ms = lastSeenAt.getTime() - firstSeenAt.getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Map a database Ad record to an API response DTO.
 */
export function toAdResponseDto(ad: Ad): AdResponseDto {
  const hasLandingPageData =
    ad.landingPageTitle || ad.landingPageHeadline || ad.landingPageOffer || ad.landingPageScreenshot;

  return {
    id: ad.id,
    externalId: ad.externalId,
    platform: ad.platform,
    brandName: ad.brandName,
    brandLogoUrl: ad.brandLogoUrl,
    adCopy: ad.adCopy,
    headline: ad.headline,
    ctaText: ad.ctaText,
    landingPageUrl: ad.landingPageUrl,
    mediaType: ad.mediaType,
    mediaUrls: ad.mediaUrls ?? [],
    screenshotUrl: ad.screenshotUrl,
    videoDurationSec: ad.videoDurationSec,
    firstSeenAt: ad.firstSeenAt.toISOString(),
    lastSeenAt: ad.lastSeenAt.toISOString(),
    isActive: ad.isActive,
    daysActive: computeDaysActive(ad.firstSeenAt, ad.lastSeenAt),
    estimatedSpend: ad.estimatedSpend,
    engagementLikes: ad.engagementLikes,
    engagementComments: ad.engagementComments,
    engagementShares: ad.engagementShares,
    sourceUrl: ad.sourceUrl,
    performanceTier: ad.performanceTier,
    performanceScore: ad.performanceScore,
    landingPage: hasLandingPageData
      ? {
          title: ad.landingPageTitle,
          headline: ad.landingPageHeadline,
          offer: ad.landingPageOffer,
          screenshotUrl: ad.landingPageScreenshot,
        }
      : null,
  };
}
