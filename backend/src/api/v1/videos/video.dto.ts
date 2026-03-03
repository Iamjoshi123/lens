/**
 * Maps a Video DB row (+ relations) to the exact shape the frontend expects.
 *
 * Frontend VideoItem type:
 *   id, title, brand, platform (lowercase), category,
 *   thumbnail, videoUrl, duration,
 *   spend?, impressions?, ctr?, engagementRate?, hookRate?,
 *   performanceTier?, heatmapZones[], transcript[]
 */

import type { VideoWithRelations } from '../../../data/repositories/video.repository.js';
import {
  formatSpend,
  formatImpressions,
  formatPercent,
} from '../../../data/repositories/video.repository.js';

export interface VideoResponseDto {
  id: string;
  title: string;
  brand: string;
  platform: 'meta' | 'tiktok' | 'youtube';
  category: string;
  thumbnail: string;
  videoUrl: string;
  duration: number;
  spend: string | null;
  impressions: string | null;
  ctr: string | null;
  engagementRate: string | null;
  hookRate: string | null;
  performanceTier: 'top' | 'high' | 'mid' | 'low' | null;
  heatmapZones: Array<{
    start: number;
    end: number;
    type: 'hook' | 'proof' | 'cta';
    label: string;
  }>;
  transcript: Array<{
    time: number;
    text: string;
  }>;
  sourceUrl: string | null;
}

export function toVideoResponseDto(v: VideoWithRelations): VideoResponseDto {
  return {
    id: v.id,
    title: v.title,
    brand: v.brand,
    // Frontend expects lowercase platform values
    platform: v.platform.toLowerCase() as 'meta' | 'tiktok' | 'youtube',
    category: v.category,
    // Frontend field is "thumbnail", not "thumbnailUrl"
    thumbnail: v.thumbnailUrl,
    videoUrl: v.videoUrl,
    duration: v.duration,
    spend: formatSpend(v.spendCents),
    impressions: formatImpressions(v.impressions),
    ctr: formatPercent(v.ctrPercent),
    engagementRate: formatPercent(v.engagementRate),
    hookRate: formatPercent(v.hookRate),
    performanceTier: v.performanceTier
      ? (v.performanceTier.toLowerCase() as 'top' | 'high' | 'mid' | 'low')
      : null,
    heatmapZones: v.heatmapZones.map((z) => ({
      start: z.startPct,
      end: z.endPct,
      type: z.type as 'hook' | 'proof' | 'cta',
      label: z.label,
    })),
    transcript: v.transcript.map((s) => ({
      time: Number(s.timeSec),
      text: s.text,
    })),
    sourceUrl: v.sourceUrl,
  };
}

/** Lightweight version for list responses (no transcript) */
export interface VideoListItemDto extends Omit<VideoResponseDto, 'transcript'> {}

export function toVideoListItemDto(v: VideoWithRelations): VideoListItemDto {
  const full = toVideoResponseDto(v);
  const { transcript: _t, ...rest } = full;
  return rest;
}
