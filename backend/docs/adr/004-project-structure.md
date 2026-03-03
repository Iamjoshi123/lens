# ADR-004: Project Structure

**Status**: Accepted
**Date**: 2026-02-26

## Context
Need a folder layout that clearly separates concerns as described in the spec, supports the tracer bullet approach (one vertical slice at a time), and is navigable for a new developer in under 1 hour.

## Decision
**Layer-based structure with co-located feature folders**

```
backend/
├── src/
│   ├── api/v1/          # Routes, request/response schemas, controllers
│   │   ├── health/
│   │   ├── ads/         # Slice 2+
│   │   ├── campaigns/   # Slice 5+
│   │   └── briefs/      # Slice 8+
│   ├── domain/          # Pure business logic — NO framework imports
│   │   ├── scoring/     # Performance tier scoring (Slice 6)
│   │   └── normalization/  # Ad data normalization (Slice 2)
│   ├── data/            # Schema, repositories, migrations, seed
│   ├── infrastructure/  # Firecrawl client, BullMQ queue, logger
│   └── config/          # Env validation, constants
├── tests/
│   ├── unit/            # Pure functions, no DB/HTTP
│   ├── integration/     # Real HTTP + DB
│   └── fixtures/        # Saved Firecrawl responses for mocking
└── docs/adr/
```

Tests are in a separate `tests/` tree (not co-located) to keep `src/` clean and make it clear what ships vs. what runs in CI only.

## Consequences
- **Positive**: New developer can find any concern immediately; domain/ layer is pure TypeScript testable without mocks.
- **Negative**: Some duplication possible between api/ DTOs and domain/ types — use explicit mapping functions rather than sharing types across layers.
