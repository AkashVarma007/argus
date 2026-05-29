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

Phase 3 — build engine. Visual canvas builder with codegen to TypeScript or Python MCP servers, downloaded as a zip.

- `/test` — scan an HTTP MCP server for spec conformance (Phase 2).
- `/build` — list builds. Open one to edit nodes (server, tool, prompt, resource, capability) on a pan/zoom canvas, then generate & download a runnable MCP server project (TS or Python).

Optional companion packages `argus-proxy` and `argus-bridge` handle CORS and stdio respectively for the test engine. The build engine is fully browser-local.
