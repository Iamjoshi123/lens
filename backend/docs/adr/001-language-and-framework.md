# ADR-001: Language and Framework

**Status**: Accepted
**Date**: 2026-02-26

## Context
Build a production-grade backend for the LENS ad intelligence platform. The frontend is TypeScript/Next.js. Requirements include strong type safety, background job processing, and external API integrations (Firecrawl, Claude). Evaluated: TypeScript/Node, Python/FastAPI, Go.

## Decision
**TypeScript with Fastify v4**

- TypeScript: matches frontend language, enabling shared type definitions; satisfies the "no `any` types" constraint natively; strong ecosystem for all required integrations.
- Fastify over Express: 2-3x faster throughput, built-in Pino structured logging (matches observability requirements), schema-based request validation, plugin architecture that avoids middleware ordering bugs.
- Fastify over Hono: Fastify has a richer plugin ecosystem (`@fastify/rate-limit`, `@fastify/cors`), better production tooling, and more mature TypeScript declarations.
- Node.js v22 LTS: active support through 2027, native `crypto.randomUUID()`, built-in fetch.

## Consequences
- **Positive**: Shared types with frontend; Claude/Firecrawl SDKs are Node-native; faster onboarding for TypeScript devs.
- **Negative**: Single-threaded event loop requires care around CPU-bound scoring logic (run in worker threads or keep it lightweight — scoring algorithm is O(1), so no concern for Slice 6).
- **Trade-off**: Python/FastAPI would have given better ML library access for Layer 2 AI features, but Claude API calls are pure HTTP, making this a non-issue.
