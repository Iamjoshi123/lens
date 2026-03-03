# ADR-006: Job Queue / Background Processing

**Status**: Accepted
**Date**: 2026-02-26

## Context
Several operations must run asynchronously: screenshot capture after ad creation (Slice 2), landing page scraping (Slice 4), nightly performance tier recalculation (Slice 6), daily ad freshness monitoring (Slice 7). Need: durable job persistence, retry with exponential backoff, job prioritization (for Firecrawl credit budget management), and cron scheduling.

## Decision
**BullMQ with Redis**

- Durable: jobs are persisted in Redis — server restarts don't lose queued work.
- Retry with backoff: BullMQ has built-in `attempts` and `backoff` configuration per job.
- Priority queues: supports job priority (TOP tier ads get higher priority for freshness checks in Slice 7).
- Cron: `QueueScheduler` + `repeat` option handles nightly batch jobs without a separate cron daemon.
- Redis is already in `docker-compose.yml` as the BullMQ broker — no additional infrastructure.

**Queue definitions** (registered in Slice 1, populated in later slices):
- `screenshot-capture` — triggered on new ad creation
- `landing-page-scrape` — triggered on new ad creation
- `ad-freshness-check` — daily cron, batch of active ads
- `performance-tier-recalc` — nightly cron, all ads

## Consequences
- **Positive**: Battle-tested at scale; built-in retry/backoff; priority queues for credit budget management.
- **Negative**: Redis is a required dependency (adds to infrastructure cost); BullMQ v5 requires Redis 7.2+.
- **Trade-off**: Agenda (MongoDB-based) would eliminate the Redis dependency, but MongoDB isn't part of our stack; a simple `setInterval`-based approach would work for Slice 1 but can't handle distributed deployments or crash recovery.
