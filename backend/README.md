# LENS Backend — Collection Engine

The data collection engine for [LENS](../README.md) — an ad intelligence platform for D2C performance marketers. This service scrapes, structures, stores, and serves ad creative data from Meta Ad Library and TikTok Creative Center.

## Architecture Decisions

All architectural decisions are documented in [`docs/adr/`](./docs/adr/):

| ADR | Decision |
|-----|----------|
| [001](./docs/adr/001-language-and-framework.md) | TypeScript + Fastify v4 |
| [002](./docs/adr/002-database.md) | PostgreSQL 16 |
| [003](./docs/adr/003-orm.md) | Drizzle ORM |
| [004](./docs/adr/004-project-structure.md) | Layer-based folder structure |
| [005](./docs/adr/005-testing-framework.md) | Vitest |
| [006](./docs/adr/006-job-queue.md) | BullMQ + Redis |

## Quick Start

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- A [Firecrawl API key](https://firecrawl.dev) (free tier available)

### 1. Configure environment

```bash
cp .env.example .env
# Edit .env — set FIRECRAWL_API_KEY at minimum
```

### 2. Start with Docker Compose

```bash
# From the backend/ directory:
FIRECRAWL_API_KEY=fc-your-key docker compose up
```

This starts:
- **API server** on `http://localhost:3001`
- **PostgreSQL** on `localhost:5432`
- **Redis** on `localhost:6379`

### 3. Run migrations + seed

```bash
# Apply database schema
npm run db:migrate

# Seed 5 sample ads for development
npm run db:seed
```

### 4. Verify everything works

```bash
curl http://localhost:3001/health
# → { "success": true, "data": { "status": "ok", "database": "connected", ... } }

curl http://localhost:3001/health/services
# → { "success": true, "data": { "firecrawl": { "status": "ok", ... } } }
```

## Development (without Docker)

```bash
# 1. Install dependencies
npm install

# 2. Copy env and fill in values
cp .env.example .env

# 3. Start PostgreSQL and Redis locally (or use docker compose for just the deps)
docker compose up postgres redis -d

# 4. Run migrations
npm run db:migrate

# 5. Seed sample data
npm run db:seed

# 6. Start dev server with hot reload
npm run dev
```

## Testing

```bash
# Fast unit tests (no DB, no HTTP server, all deps mocked)
npm run test:unit

# Integration tests (requires a test DB — see .env.test)
npm run test:integration

# All tests
npm run test:all

# With coverage
npm run test:coverage
```

### Setting up the test database

```bash
# Create test DB (adjust credentials if needed)
createdb lens_test

# Apply migrations to test DB
DATABASE_URL=postgresql://lens:lens_dev_pass@localhost:5432/lens_test npm run db:migrate
```

## Project Structure

```
backend/
├── src/
│   ├── api/v1/           # Routes, controllers, request/response schemas
│   │   ├── health/       # GET /health, GET /health/services
│   │   └── router.ts     # /api/v1 prefix registration
│   ├── domain/           # Pure business logic — no framework imports
│   │   └── scoring/      # Performance tier scoring (Slice 6)
│   ├── data/             # Database schema, migrations, repositories, seed
│   │   ├── migrations/   # SQL migration files (up + down)
│   │   ├── schema.ts     # Drizzle ORM table definitions
│   │   ├── db.ts         # Connection pool + db instance
│   │   ├── migrate.ts    # Migration runner CLI
│   │   └── seed.ts       # Development seed data
│   ├── infrastructure/   # External service clients, job queue, logger
│   │   ├── firecrawl/    # Firecrawl API wrapper
│   │   ├── queue/        # BullMQ job queue definitions
│   │   └── logger/       # Pino structured logger
│   ├── config/           # Environment validation, constants
│   ├── app.ts            # Fastify app factory
│   └── index.ts          # Entry point
├── tests/
│   ├── unit/             # Pure function tests, no DB/HTTP (fast)
│   ├── integration/      # Full HTTP + DB tests
│   └── fixtures/         # Saved Firecrawl responses for mocking
└── docs/adr/             # Architecture Decision Records
```

## API Reference

### Health

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Server + database liveness check |
| `GET` | `/health/services` | External service (Firecrawl) status |

**Response shape (all endpoints):**

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": { "code": "ERROR_CODE", "message": "...", "details": [] } }
```

### Rate Limits

| Endpoint type | Limit |
|---------------|-------|
| Search endpoints (`POST /api/v1/ads/search`) | 10 req/min per user |
| CRUD endpoints | 60 req/min per user |

Rate limit headers included on every response:
- `x-ratelimit-limit`
- `x-ratelimit-remaining`
- `x-ratelimit-reset`

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `FIRECRAWL_API_KEY` | ✅ | — | Firecrawl API key |
| `REDIS_URL` | — | `redis://redis:6379` | Redis connection URL |
| `PORT` | — | `3001` | HTTP server port |
| `NODE_ENV` | — | `development` | `development`, `production`, `test` |
| `LOG_LEVEL` | — | `info` | `debug`, `info`, `warn`, `error` |
| `FIRECRAWL_DAILY_CREDIT_BUDGET` | — | `500` | Max Firecrawl credits per day |

See `.env.example` for the full list.

## Database Migrations

Migrations are plain SQL files in `src/data/migrations/`. Every migration has a corresponding `_down.sql` file for rollback.

```bash
# Apply all pending migrations
npm run db:migrate

# Roll back the last migration
npm run db:migrate:down

# Generate a new migration from schema changes (Drizzle)
npm run db:generate
```

## Implementation Status

| Slice | Status | Description |
|-------|--------|-------------|
| **Slice 1** | ✅ Complete | Project bootstrap, health endpoints, DB schema |
| Slice 2 | 🔲 Pending | Ad search — Meta Ad Library via Firecrawl |
| Slice 3 | 🔲 Pending | Ad search — TikTok Creative Center |
| Slice 4 | 🔲 Pending | Landing page analysis & enrichment |
| Slice 5 | 🔲 Pending | Campaign & library management |
| Slice 6 | 🔲 Pending | Performance tier scoring (heuristic) |
| Slice 7 | 🔲 Pending | Continuous monitoring & freshness |
| Slice 8 | 🔲 Pending | Brief generation endpoint (stub) |
