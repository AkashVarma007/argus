# Argus

MCP conformance, build, and learn platform. Browser-only. No backend. State in `localStorage`.

## First scan in 60 seconds

```bash
pnpm install
pnpm dev                                  # http://localhost:3000
```

1. Open the dev server in your browser.
2. Press `g t` (or click the **test** tab) to reach `/test`.
3. **HTTP server?** Paste its URL into "Endpoint", leave the transport as `streamable-http`, click **Run scan**.
4. **stdio server?** In another terminal:
   ```bash
   npm i -g argus-bridge
   argus-bridge                            # ws://127.0.0.1:7879/bridge
   ```
   Then in the UI: transport → `stdio (via bridge)`, paste your server command (e.g. `node my-server.js`), click **Run scan**.
5. Watch the live progress strip → grade reveal.

Or, build a fresh MCP server from scratch:

1. Press `g b` to reach `/build`.
2. **+ New build** → drop nodes (server, tool, prompt, resource) onto the canvas.
3. **Generate** → download a runnable TypeScript or Python project.

## Surfaces

| Path     | Shortcut | Purpose |
|----------|----------|---------|
| `/`      | `g h`    | Home — recent scans and recent builds. |
| `/test`  | `g t`    | Conformance scanner. 60+ checks across transport, lifecycle, capabilities, tools, resources, prompts, sampling, security. |
| `/build` | `g b`    | Visual MCP server composer. Validates against the spec; generates a runnable project. |
| `/learn` | `g l`    | DRAFT-2026-v1 spec browser. Deep-linked from failed checks and build issues. |

Press `⌘K` anywhere in `/learn` to open the spec search palette.

## Develop

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # unit (Vitest) — currently 500+ tests
pnpm typecheck
pnpm build        # static export to ./out
pnpm sync-spec    # re-vendor the spec from ../modelcontextprotocol-main/
```

## E2E (Playwright)

```bash
pnpm test:e2e:install   # one-time: download Chromium
cd ../argus-bridge && pnpm install && pnpm build
cd ../argus
pnpm test:e2e
```

Spawns `argus-bridge` against an in-tree stub MCP server, drives a real Chromium through home → test → grade reveal. See `tests/e2e/README.md`.

## Layout

- `app/`        — Next.js App Router routes
- `components/` — UI components (chrome, lattice, primitives, test, build, learn)
- `lib/`        — design tokens, stores, conformance engine, generators
- `tests/unit/` — Vitest unit tests
- `tests/e2e/`  — Playwright happy-path

## Companion packages

- `argus-bridge` — WebSocket↔stdio bridge so the browser can scan stdio-only MCP servers. See `../argus-bridge/README.md`.
- `argus-proxy`  — optional CORS proxy for cross-origin HTTP scans.

The build engine and learn tool are fully browser-local; only the test engine needs a companion for stdio or cross-origin HTTP.

## Spec sync

The DRAFT-2026-v1 spec is vendored at build time. `pnpm prebuild` runs `tsx scripts/sync-spec.ts`, which reads `../modelcontextprotocol-main/docs/specification/draft/**/*.{md,mdx}` and writes `public/spec-source/draft-2026-v1/<slug>.md` plus a JSON index. Re-run `pnpm sync-spec` after a spec bump.

## Status

Phases 1–6 complete on `phase4-learn-tool`:

- Phase 1 — shell, Lattice, TabStrip, CommandPalette.
- Phase 2 — conformance engine (60+ checks).
- Phase 3 — build engine with typed lattice, validation, codegen.
- Phase 4 — learn tool with spec tree, body, outline, palette, deep links.
- Phase 5 — `argus-bridge` stdio bridge, `--cmd` mode, readiness probe.
- Phase 6 — empty states, error states, `g`-prefix shortcuts, lazy category groups, virtualized log, Playwright happy-path.
