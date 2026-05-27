# Argus

MCP conformance, build, and learn platform. Browser-only. No backend. State in `localStorage`.

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # unit (Vitest)
pnpm typecheck
pnpm build        # static export to ./out
```

E2E (Playwright) ships in Phase 6.

## Layout

- `app/`        — Next.js App Router routes
- `components/` — UI components (chrome, lattice, primitives)
- `lib/`        — design tokens, stores, conformance engine, generators
- `tests/`      — unit tests

## Status

Phase 1 — shell scaffolding (this directory).
