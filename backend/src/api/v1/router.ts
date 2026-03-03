/**
 * /api/v1 router
 * Registers all v1 API routes. New slices add their route registrations here.
 */

import type { FastifyInstance } from 'fastify';
import { adRoutes } from './ads/ad.routes.js';
import { videoRoutes } from './videos/video.routes.js';
import { briefRoutes } from './briefs/brief.routes.js';

export async function v1Router(app: FastifyInstance): Promise<void> {
  // Collection Engine — scrapes and stores ads
  await app.register(adRoutes, { prefix: '/ads' });

  // Frontend-facing API — videos feed, briefs, hooks, reactions
  await app.register(videoRoutes, { prefix: '/videos' });
  await app.register(briefRoutes, { prefix: '/briefs' });

  app.get('/ping', async () => ({ success: true, data: { pong: true } }));
}
