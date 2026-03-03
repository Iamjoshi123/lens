import { and, asc, desc, eq, gt, ilike, isNotNull, or, sql } from 'drizzle-orm';
import { db } from '../db.js';
import * as schema from '../schema.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface VideoWithRelations extends schema.Video {
  heatmapZones: schema.HeatmapZone[];
  transcript: schema.TranscriptSegment[];
}

export interface ListVideosOptions {
  q?: string;
  platform?: 'META' | 'TIKTOK' | 'YOUTUBE';
  category?: string;
  performanceTier?: 'TOP' | 'HIGH' | 'MID' | 'LOW';
  sortBy?: 'createdAt' | 'spend' | 'impressions' | 'hookRate';
  cursor?: string; // ISO timestamp of last item's createdAt
  limit?: number;
}

export interface ListVideosResult {
  videos: schema.Video[];
  nextCursor: string | null;
  hasMore: boolean;
  total: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Format cents → "$45K" style string */
export function formatSpend(cents: string | null): string | null {
  if (!cents) return null;
  const dollars = Number(cents) / 100;
  if (dollars >= 1_000_000) return `$${(dollars / 1_000_000).toFixed(1)}M`;
  if (dollars >= 1_000) return `$${Math.round(dollars / 1_000)}K`;
  return `$${Math.round(dollars)}`;
}

/** Format raw number → "2.3M" style string */
export function formatImpressions(raw: string | null): string | null {
  if (!raw) return null;
  const n = Number(raw);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Format decimal percent → "2.8%" style string */
export function formatPercent(raw: string | null): string | null {
  if (!raw) return null;
  return `${Number(raw).toFixed(1)}%`;
}

// ─── Repository ───────────────────────────────────────────────────────────────

export async function listVideos(opts: ListVideosOptions = {}): Promise<ListVideosResult> {
  const limit = Math.min(opts.limit ?? 20, 50);

  // Build WHERE conditions
  const conditions = [];

  if (opts.q) {
    // Full-text search via tsvector, falling back to ilike for flexibility
    const q = opts.q;
    conditions.push(
      or(
        // Full-text search via generated tsvector column (raw SQL — not in Drizzle type)
        sql`search_vector @@ plainto_tsquery('english', ${q})`,
        ilike(schema.videos.title, `%${q}%`),
        ilike(schema.videos.brand, `%${q}%`),
        ilike(schema.videos.category, `%${q}%`),
      ),
    );
  }

  if (opts.platform) {
    conditions.push(eq(schema.videos.platform, opts.platform));
  }

  if (opts.category) {
    conditions.push(ilike(schema.videos.category, `%${opts.category}%`));
  }

  if (opts.performanceTier) {
    conditions.push(eq(schema.videos.performanceTier, opts.performanceTier));
  }

  // Cursor-based pagination — cursor is the createdAt of the last item
  if (opts.cursor) {
    conditions.push(gt(schema.videos.createdAt, new Date(opts.cursor)));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  // Sort order
  const orderBy =
    opts.sortBy === 'spend'
      ? desc(schema.videos.spendCents)
      : opts.sortBy === 'impressions'
        ? desc(schema.videos.impressions)
        : opts.sortBy === 'hookRate'
          ? desc(schema.videos.hookRate)
          : desc(schema.videos.createdAt);

  // Fetch limit+1 to detect hasMore
  const rows = await db
    .select()
    .from(schema.videos)
    .where(where)
    .orderBy(orderBy)
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const lastItem = items[items.length - 1];
  const nextCursor = hasMore && lastItem ? lastItem.createdAt.toISOString() : null;

  // Count total matching (without cursor) for display
  const countConditions = conditions.filter(
    // Remove cursor condition from count
    (_, i) => !(opts.cursor && i === conditions.length - 1),
  );
  const countWhere = countConditions.length > 0 ? and(...countConditions) : undefined;
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.videos)
    .where(countWhere);

  const total = countResult[0]?.count ?? 0;
  return { videos: items, nextCursor, hasMore, total };
}

export async function getVideoById(id: string): Promise<VideoWithRelations | null> {
  const video = await db.query.videos.findFirst({
    where: eq(schema.videos.id, id),
  });

  if (!video) return null;

  const [heatmapZones, transcript] = await Promise.all([
    db
      .select()
      .from(schema.heatmapZones)
      .where(eq(schema.heatmapZones.videoId, id)),
    db
      .select()
      .from(schema.transcriptSegments)
      .where(eq(schema.transcriptSegments.videoId, id))
      .orderBy(asc(schema.transcriptSegments.timeSec)),
  ]);

  return { ...video, heatmapZones, transcript };
}

export async function getVideosByIds(ids: string[]): Promise<schema.Video[]> {
  if (ids.length === 0) return [];
  return db
    .select()
    .from(schema.videos)
    .where(
      or(...ids.map((id) => eq(schema.videos.id, id))),
    );
}
