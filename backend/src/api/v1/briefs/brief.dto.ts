/**
 * Maps BriefWithRelations → the exact shape the frontend's Brief type expects.
 *
 * Frontend Brief type:
 *   id, title, campaign, angle, content, hooks: HookSnippet[],
 *   referenceVideoIds, likedVideoIds, dislikedVideoIds,
 *   collaborators: Collaborator[], archived, createdAt, updatedAt
 */

import type { BriefWithRelations } from '../../../data/repositories/brief.repository.js';

export interface CollaboratorDto {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  role: string;
}

export interface HookSnippetDto {
  id: string;
  videoId: string;
  videoTitle: string;
  thumbnail: string;
  timestamp: string; // "0:00 – 0:03"
  notes: string;
}

export interface BriefResponseDto {
  id: string;
  title: string;
  campaign: string;
  angle: string;
  content: string;
  hooks: HookSnippetDto[];
  referenceVideoIds: string[];
  likedVideoIds: string[];
  dislikedVideoIds: string[];
  collaborators: CollaboratorDto[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Format "0:00 – 0:03" from decimal seconds */
function formatTimestamp(start: string, end: string): string {
  const fmt = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, '0')}`;
  };
  return `${fmt(Number(start))} – ${fmt(Number(end))}`;
}

/** Derive initials from a display name */
function toInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function toBriefResponseDto(b: BriefWithRelations): BriefResponseDto {
  return {
    id: b.id,
    title: b.title,
    campaign: b.campaign,
    angle: b.angle,
    content: b.content,
    hooks: b.hooks.map((h) => ({
      id: h.id,
      videoId: h.videoId,
      videoTitle: h.videoTitle,
      // Frontend uses "thumbnail" not "thumbnailUrl"
      thumbnail: h.thumbnailUrl,
      timestamp: formatTimestamp(h.startTime, h.endTime),
      notes: h.notes,
    })),
    referenceVideoIds: b.referenceVideoIds,
    likedVideoIds: b.likedVideoIds,
    dislikedVideoIds: b.dislikedVideoIds,
    collaborators: b.collaborators.map((c) => ({
      id: c.userId,
      name: c.name,
      email: c.email,
      initials: toInitials(c.name),
      color: c.avatarColor,
      role: c.role,
    })),
    archived: b.archived,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}
