/**
 * Brief routes — /api/v1/briefs
 *
 * Full CRUD + references, hooks, reactions.
 * Auth is stubbed: all actions use DEV_USER_ID until JWT auth is added.
 */

import type { FastifyInstance } from 'fastify';
import {
  listBriefs,
  getBriefById,
  createBrief,
  updateBrief,
  archiveBrief,
  deleteBrief,
  addReference,
  removeReference,
  addHook,
  removeHook,
  updateHookNotes,
  upsertReaction,
  removeReaction,
  DEV_USER_ID,
} from '../../../data/repositories/brief.repository.js';
import { getVideoById } from '../../../data/repositories/video.repository.js';
import { toBriefResponseDto } from './brief.dto.js';
import { buildErrorResponse } from '../../error-handler.js';

export async function briefRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /briefs ─────────────────────────────────────────────────────────────
  app.get(
    '/',
    {
      schema: {
        querystring: {
          type: 'object',
          properties: {
            archived: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const { archived } = request.query as { archived?: boolean };
      const briefs = await listBriefs(DEV_USER_ID, archived ?? false);
      return reply.status(200).send({
        success: true,
        data: briefs.map(toBriefResponseDto),
      });
    },
  );

  // ── POST /briefs ────────────────────────────────────────────────────────────
  app.post(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          required: ['title'],
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 500 },
            campaign: { type: 'string', maxLength: 500 },
            angle: { type: 'string', maxLength: 500 },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body as { title: string; campaign?: string; angle?: string };
      const brief = await createBrief(body, DEV_USER_ID);
      return reply.status(201).send({
        success: true,
        data: toBriefResponseDto(brief),
      });
    },
  );

  // ── GET /briefs/:id ─────────────────────────────────────────────────────────
  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const brief = await getBriefById(id, DEV_USER_ID);
    if (!brief) {
      return reply.status(404).send(buildErrorResponse('NOT_FOUND', 'Brief not found.'));
    }
    return reply.status(200).send({ success: true, data: toBriefResponseDto(brief) });
  });

  // ── PATCH /briefs/:id ───────────────────────────────────────────────────────
  app.patch(
    '/:id',
    {
      schema: {
        body: {
          type: 'object',
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 500 },
            campaign: { type: 'string', maxLength: 500 },
            angle: { type: 'string', maxLength: 500 },
            content: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        title?: string;
        campaign?: string;
        angle?: string;
        content?: string;
      };
      const updated = await updateBrief(id, body);
      if (!updated) {
        return reply.status(404).send(buildErrorResponse('NOT_FOUND', 'Brief not found.'));
      }
      const brief = await getBriefById(id, DEV_USER_ID);
      return reply.status(200).send({ success: true, data: toBriefResponseDto(brief!) });
    },
  );

  // ── DELETE /briefs/:id ──────────────────────────────────────────────────────
  app.delete('/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    await deleteBrief(id);
    return reply.status(200).send({ success: true });
  });

  // ── POST /briefs/:id/archive ────────────────────────────────────────────────
  app.post('/:id/archive', async (request, reply) => {
    const { id } = request.params as { id: string };
    await archiveBrief(id, true);
    return reply.status(200).send({ success: true });
  });

  // ── POST /briefs/:id/unarchive ──────────────────────────────────────────────
  app.post('/:id/unarchive', async (request, reply) => {
    const { id } = request.params as { id: string };
    await archiveBrief(id, false);
    return reply.status(200).send({ success: true });
  });

  // ── POST /briefs/:id/references ─────────────────────────────────────────────
  app.post(
    '/:id/references',
    {
      schema: {
        body: {
          type: 'object',
          required: ['videoId'],
          properties: { videoId: { type: 'string', format: 'uuid' } },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { videoId } = request.body as { videoId: string };
      await addReference(id, videoId, DEV_USER_ID);
      return reply.status(201).send({ success: true });
    },
  );

  // ── DELETE /briefs/:id/references/:videoId ──────────────────────────────────
  app.delete('/:id/references/:videoId', async (request, reply) => {
    const { id, videoId } = request.params as { id: string; videoId: string };
    await removeReference(id, videoId);
    return reply.status(200).send({ success: true });
  });

  // ── POST /briefs/:id/hooks ──────────────────────────────────────────────────
  app.post(
    '/:id/hooks',
    {
      schema: {
        body: {
          type: 'object',
          required: ['videoId'],
          properties: {
            videoId: { type: 'string', format: 'uuid' },
            startTime: { type: 'number', minimum: 0 },
            endTime: { type: 'number', minimum: 0 },
            notes: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const body = request.body as {
        videoId: string;
        startTime?: number;
        endTime?: number;
        notes?: string;
      };

      // Look up video to get title + thumbnail
      const video = await getVideoById(body.videoId);
      if (!video) {
        return reply
          .status(404)
          .send(buildErrorResponse('NOT_FOUND', 'Video not found.'));
      }

      const hook = await addHook({
        briefId: id,
        videoId: body.videoId,
        videoTitle: video.title,
        thumbnailUrl: video.thumbnailUrl,
        startTime: body.startTime ?? 0,
        endTime: body.endTime ?? 3,
        notes: body.notes ?? '',
      });

      // Return in frontend HookSnippet shape
      const fmt = (sec: number) => {
        const m = Math.floor(sec / 60);
        const s = Math.floor(sec % 60);
        return `${m}:${String(s).padStart(2, '0')}`;
      };

      return reply.status(201).send({
        success: true,
        data: {
          id: hook.id,
          videoId: hook.videoId,
          videoTitle: hook.videoTitle,
          thumbnail: hook.thumbnailUrl,
          timestamp: `${fmt(Number(hook.startTime))} – ${fmt(Number(hook.endTime))}`,
          notes: hook.notes,
        },
      });
    },
  );

  // ── DELETE /briefs/:id/hooks/:hookId ────────────────────────────────────────
  app.delete('/:id/hooks/:hookId', async (request, reply) => {
    const { id, hookId } = request.params as { id: string; hookId: string };
    await removeHook(hookId, id);
    return reply.status(200).send({ success: true });
  });

  // ── PATCH /briefs/:id/hooks/:hookId ─────────────────────────────────────────
  app.patch(
    '/:id/hooks/:hookId',
    {
      schema: {
        body: {
          type: 'object',
          required: ['notes'],
          properties: { notes: { type: 'string' } },
        },
      },
    },
    async (request, reply) => {
      const { hookId } = request.params as { id: string; hookId: string };
      const { notes } = request.body as { notes: string };
      const updated = await updateHookNotes(hookId, notes);
      if (!updated) {
        return reply.status(404).send(buildErrorResponse('NOT_FOUND', 'Hook not found.'));
      }
      return reply.status(200).send({ success: true, data: updated });
    },
  );

  // ── POST /briefs/:id/reactions ──────────────────────────────────────────────
  app.post(
    '/:id/reactions',
    {
      schema: {
        body: {
          type: 'object',
          required: ['videoId', 'reaction'],
          properties: {
            videoId: { type: 'string', format: 'uuid' },
            reaction: { type: 'string', enum: ['like', 'dislike'] },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const { videoId, reaction } = request.body as {
        videoId: string;
        reaction: 'like' | 'dislike';
      };
      await upsertReaction(id, videoId, DEV_USER_ID, reaction);
      return reply.status(201).send({ success: true });
    },
  );

  // ── DELETE /briefs/:id/reactions/:videoId ───────────────────────────────────
  app.delete('/:id/reactions/:videoId', async (request, reply) => {
    const { id, videoId } = request.params as { id: string; videoId: string };
    await removeReaction(id, videoId, DEV_USER_ID);
    return reply.status(200).send({ success: true });
  });
}
