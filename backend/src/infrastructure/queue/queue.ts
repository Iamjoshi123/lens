/**
 * BullMQ job queue infrastructure.
 *
 * Slice 1: Queue definitions and connection management only.
 * Workers and job handlers are added in Slices 2, 4, 6, 7.
 */

import { Queue, QueueOptions } from 'bullmq';
import { env } from '../../config/env.js';
import { logger } from '../logger/index.js';
import { QUEUE_NAMES } from '../../config/constants.js';

// ─── Connection config ─────────────────────────────────────────────────────────

const redisConnection = {
  host: new URL(env.REDIS_URL).hostname,
  port: parseInt(new URL(env.REDIS_URL).port || '6379', 10),
  password: new URL(env.REDIS_URL).password || undefined,
  maxRetriesPerRequest: null, // Required by BullMQ
};

const defaultQueueOptions: QueueOptions = {
  connection: redisConnection,
  defaultJobOptions: {
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
};

// ─── Queue instances ───────────────────────────────────────────────────────────

let screenshotQueue: Queue | null = null;
let landingPageQueue: Queue | null = null;
let freshnessCheckQueue: Queue | null = null;
let tierRecalcQueue: Queue | null = null;

export function getScreenshotQueue(): Queue {
  screenshotQueue ??= new Queue(QUEUE_NAMES.SCREENSHOT_CAPTURE, defaultQueueOptions);
  return screenshotQueue;
}

export function getLandingPageQueue(): Queue {
  landingPageQueue ??= new Queue(QUEUE_NAMES.LANDING_PAGE_SCRAPE, defaultQueueOptions);
  return landingPageQueue;
}

export function getFreshnessCheckQueue(): Queue {
  freshnessCheckQueue ??= new Queue(QUEUE_NAMES.AD_FRESHNESS_CHECK, defaultQueueOptions);
  return freshnessCheckQueue;
}

export function getTierRecalcQueue(): Queue {
  tierRecalcQueue ??= new Queue(QUEUE_NAMES.PERFORMANCE_TIER_RECALC, defaultQueueOptions);
  return tierRecalcQueue;
}

export async function closeAllQueues(): Promise<void> {
  const queues = [screenshotQueue, landingPageQueue, freshnessCheckQueue, tierRecalcQueue].filter(
    Boolean,
  ) as Queue[];

  await Promise.all(queues.map((q) => q.close()));
  screenshotQueue = null;
  landingPageQueue = null;
  freshnessCheckQueue = null;
  tierRecalcQueue = null;
  logger.info('All job queues closed');
}

export { redisConnection };
