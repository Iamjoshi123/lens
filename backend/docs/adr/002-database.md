# ADR-002: Database

**Status**: Accepted
**Date**: 2026-02-26

## Context
Store ads (with JSONB raw scrape data), campaigns, briefs, search audit logs. Need: JSONB support for raw_scraped_data and brand_context; full-text search; reliable foreign key enforcement; 10x growth path. Evaluated: PostgreSQL, SQLite+Turso, MongoDB.

## Decision
**PostgreSQL 16**

- Native JSONB with indexing: raw_scraped_data, filters_applied, brand_context are all JSONB — PostgreSQL handles this as a first-class type with GIN indexes and `@>` operator queries.
- Full-text search: `tsvector`/`tsquery` built-in — avoids adding Elasticsearch for Slice 2's ad search without a separate service.
- Relational integrity: campaign→ads, briefs→campaigns use foreign keys; PostgreSQL enforces these reliably.
- Horizontal scaling path: read replicas, partitioning by `platform` or `created_at` are well-understood PostgreSQL patterns.
- 10x growth: A single PostgreSQL instance handles millions of ads rows comfortably with proper indexing.

## Consequences
- **Positive**: JSONB + relational in one system; battle-tested; great Drizzle/Node.js ecosystem support.
- **Negative**: Heavier than SQLite for local development (requires Docker); more ops overhead than Turso.
- **Trade-off**: MongoDB's flexible document model would simplify the ad schema iteration, but the relational joins (campaigns↔ads, briefs↔campaigns) are better served by PostgreSQL.
