/**
 * Video routes — GET /api/v1/videos, GET /api/v1/videos/:id
 *
 * Serves the frontend's ad creative feed with full-text search,
 * filtering, cursor pagination, and per-video heatmap + transcript.
 */

import type { FastifyInstance } from 'fastify';
import {
  listVideos,
  getVideoById,
} from '../../../data/repositories/video.repository.js';
import { toVideoResponseDto, toVideoListItemDto } from './video.dto.js';
import { buildErrorResponse } from '../../error-handler.js';

export async function videoRoutes(app: FastifyInstance): Promise<void> {
  /**
   * GET /api/v1/videos
   * List / search videos with optional filters and cursor pagination.
   */
  app.get(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            q: { type: 'string', minLength: 1, maxLength: 200 },
            platform: { type: 'string', enum: ['META', 'TIKTOK', 'YOUTUBE'] },
            category: { type: 'string', maxLength: 100 },
            performanceTier: { type: 'string', enum: ['TOP', 'HIGH', 'MID', 'LOW'] },
            sortBy: {
              type: 'string',
              enum: ['createdAt', 'spend', 'impressions', 'hookRate'],
            },
            cursor: { type: 'string' },
            limit: { type: 'integer', minimum: 1, maximum: 50 },
          },
        },
      },
    },
    async (request, reply) => {
      const query = request.query as {
        q?: string;
        platform?: 'META' | 'TIKTOK' | 'YOUTUBE';
        category?: string;
        performanceTier?: 'TOP' | 'HIGH' | 'MID' | 'LOW';
        sortBy?: 'createdAt' | 'spend' | 'impressions' | 'hookRate';
        cursor?: string;
        limit?: number;
      };

      const opts: Parameters<typeof listVideos>[0] = {};
      if (query.q) opts.q = query.q;
      if (query.platform) opts.platform = query.platform;
      if (query.category) opts.category = query.category;
      if (query.performanceTier) opts.performanceTier = query.performanceTier;
      if (query.sortBy) opts.sortBy = query.sortBy;
      if (query.cursor) opts.cursor = query.cursor;
      if (query.limit) opts.limit = query.limit;

      const result = await listVideos(opts);

      // Attach heatmap zones for list view (no transcript for bandwidth)
      const dtos = result.videos.map((v) =>
        toVideoListItemDto({ ...v, heatmapZones: [], transcript: [] }),
      );

      return reply.status(200).send({
        success: true,
        data: dtos,
        pagination: {
          nextCursor: result.nextCursor,
          hasMore: result.hasMore,
          total: result.total,
        },
      });
    },
  );

  /**
   * GET /api/v1/videos/:id
   * Get a single video with heatmap zones + full transcript.
   */
  app.get(
    '/:id',
    {
      schema: {
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const video = await getVideoById(id);

      if (!video) {
        return reply.status(404).send(
          buildErrorResponse('NOT_FOUND', `Video ${id} not found.`),
        );
      }

      return reply.status(200).send({
        success: true,
        data: toVideoResponseDto(video),
      });
    },
  );
}
