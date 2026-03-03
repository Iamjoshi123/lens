/**
 * API client — thin wrapper around fetch for the LENS backend.
 * All functions return typed data or throw on non-2xx responses.
 */

import type { VideoItem, Brief, HookSnippet } from './mockData.js';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message ?? `API error ${res.status}`);
  }
  return json.data as T;
}

// ─── Videos ───────────────────────────────────────────────────────────────────

export interface VideoListResult {
  videos: VideoItem[];
  pagination: { nextCursor: string | null; hasMore: boolean; total: number };
}

export async function fetchVideos(params?: {
  q?: string;
  platform?: string;
  category?: string;
  performanceTier?: string;
  cursor?: string;
  limit?: number;
}): Promise<VideoListResult> {
  const qs = new URLSearchParams();
  if (params?.q) qs.set('q', params.q);
  if (params?.platform) qs.set('platform', params.platform.toUpperCase());
  if (params?.category) qs.set('category', params.category);
  if (params?.performanceTier) qs.set('performanceTier', params.performanceTier.toUpperCase());
  if (params?.cursor) qs.set('cursor', params.cursor);
  if (params?.limit) qs.set('limit', String(params.limit));

  const query = qs.toString();
  const res = await fetch(`${BASE}/videos${query ? `?${query}` : ''}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.error?.message ?? `API error ${res.status}`);
  }
  return { videos: json.data as VideoItem[], pagination: json.pagination };
}

export async function fetchVideo(id: string): Promise<VideoItem> {
  return request<VideoItem>(`/videos/${id}`);
}

// ─── Briefs ───────────────────────────────────────────────────────────────────

export async function fetchBriefs(archived = false): Promise<Brief[]> {
  return request<Brief[]>(`/briefs?archived=${archived}`);
}

export async function fetchBrief(id: string): Promise<Brief> {
  return request<Brief>(`/briefs/${id}`);
}

export async function createBrief(data: {
  title: string;
  campaign?: string;
  angle?: string;
}): Promise<Brief> {
  return request<Brief>('/briefs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateBrief(
  id: string,
  data: { title?: string; campaign?: string; angle?: string; content?: string },
): Promise<Brief> {
  return request<Brief>(`/briefs/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function deleteBrief(id: string): Promise<void> {
  await request<void>(`/briefs/${id}`, { method: 'DELETE' });
}

export async function archiveBrief(id: string): Promise<void> {
  await request<void>(`/briefs/${id}/archive`, { method: 'POST' });
}

export async function unarchiveBrief(id: string): Promise<void> {
  await request<void>(`/briefs/${id}/unarchive`, { method: 'POST' });
}

// ─── References ───────────────────────────────────────────────────────────────

export async function addReference(briefId: string, videoId: string): Promise<void> {
  await request<void>(`/briefs/${briefId}/references`, {
    method: 'POST',
    body: JSON.stringify({ videoId }),
  });
}

export async function removeReference(briefId: string, videoId: string): Promise<void> {
  await request<void>(`/briefs/${briefId}/references/${videoId}`, { method: 'DELETE' });
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export async function addHook(
  briefId: string,
  videoId: string,
  startTime = 0,
  endTime = 3,
  notes = '',
): Promise<HookSnippet> {
  return request<HookSnippet>(`/briefs/${briefId}/hooks`, {
    method: 'POST',
    body: JSON.stringify({ videoId, startTime, endTime, notes }),
  });
}

export async function removeHook(briefId: string, hookId: string): Promise<void> {
  await request<void>(`/briefs/${briefId}/hooks/${hookId}`, { method: 'DELETE' });
}

// ─── Ad Search (Firecrawl scraper) ────────────────────────────────────────────

export interface AdSearchResult {
  id: string;
  externalId: string | null;
  platform: 'META' | 'TIKTOK' | 'YOUTUBE';
  brandName: string;
  adCopy: string;
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL';
  mediaUrls: string[];
  screenshotUrl: string | null;
  videoDurationSec: number | null;
  estimatedSpend: string | null;
  engagementLikes: number | null;
  engagementComments: number | null;
  engagementShares: number | null;
  performanceTier: 'TOP' | 'HIGH' | 'MID' | 'LOW' | null;
  performanceScore: number | null;
  isActive: boolean;
  firstSeenAt: string;
  lastSeenAt: string;
  sourceUrl: string | null;
}

export interface AdSearchResponse {
  results: AdSearchResult[];
  totalFound: number;
  searchId: string;
}

export async function searchAds(
  query: string,
  platform: 'META' | 'TIKTOK' = 'META',
  options?: { country?: string; limit?: number },
): Promise<AdSearchResponse> {
  return request<AdSearchResponse>('/ads/search', {
    method: 'POST',
    body: JSON.stringify({
      query,
      platform,
      country: options?.country ?? 'US',
      limit: options?.limit ?? 20,
    }),
  });
}

/** Convert an AdSearchResult to the VideoItem shape the UI expects. */
export function adResultToVideoItem(ad: AdSearchResult): VideoItem {
  const thumbnail = ad.screenshotUrl ?? ad.mediaUrls[0] ?? '';
  const videoUrl = ad.mediaUrls.find(u => /\.(mp4|webm|mov|m3u8)/i.test(u)) ?? ad.mediaUrls[0] ?? '';
  const tier = ad.performanceTier?.toLowerCase() as VideoItem['performanceTier'];

  return {
    id: ad.id,
    title: ad.adCopy || `${ad.brandName} ad`,
    brand: ad.brandName,
    platform: ad.platform.toLowerCase() as VideoItem['platform'],
    category: 'ad',
    thumbnail,
    videoUrl,
    duration: ad.videoDurationSec ?? 30,
    heatmapZones: [],
    transcript: [],
    spend: ad.estimatedSpend ?? undefined,
    performanceTier: tier ?? undefined,
  };
}

// ─── Reactions ────────────────────────────────────────────────────────────────

export async function addReaction(
  briefId: string,
  videoId: string,
  reaction: 'like' | 'dislike',
): Promise<void> {
  await request<void>(`/briefs/${briefId}/reactions`, {
    method: 'POST',
    body: JSON.stringify({ videoId, reaction }),
  });
}

export async function removeReaction(briefId: string, videoId: string): Promise<void> {
  await request<void>(`/briefs/${briefId}/reactions/${videoId}`, { method: 'DELETE' });
}
