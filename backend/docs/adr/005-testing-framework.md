# ADR-005: Testing Framework

**Status**: Accepted
**Date**: 2026-02-26

## Context
Need a test framework that supports: fast unit tests with no DB, integration tests against a real test DB, mocking of Firecrawl external calls (never hit real Firecrawl in CI), and fixture replay.

## Decision
**Vitest**

- TypeScript-native: no configuration needed to run `.ts` test files; same `tsconfig.json` as source.
- Fast: runs tests in parallel by default; significantly faster than Jest for TypeScript projects.
- Jest-compatible API: `describe`, `it`, `expect`, `vi.mock()` — minimal learning curve.
- Built-in mocking: `vi.mock()` for module mocking (Firecrawl service), `vi.spyOn()` for spy-based assertions.
- Fastify integration: `app.inject()` enables HTTP-level testing without a real server port.

**Test strategy per slice**:
- `tests/unit/` — pure functions (scoring, normalization, dedup). No DB. No imports from `infrastructure/`.
- `tests/integration/` — real Fastify server + real PostgreSQL (test DB). Uses `TEST_DATABASE_URL`.
- `tests/fixtures/` — JSON files capturing real Firecrawl responses, replayed via `vi.mock()`.

## Consequences
- **Positive**: Same DX as Jest; fast; no Babel config needed.
- **Negative**: Vitest ecosystem is smaller than Jest for some edge-case plugins; snapshot diffing is slightly different.
