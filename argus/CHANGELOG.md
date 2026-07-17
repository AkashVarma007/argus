# Changelog

All notable changes to Argus will be documented in this file.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-05-29

First end-to-end release. Argus is a browser-only MCP conformance, build, and learn platform.

### Phase 1 — shell

- Lattice frame, TitleBar, TabStrip with `spec://`-style tab IDs.
- CommandPalette wiring at the shell level.
- Zustand stores with `persisted` middleware over `localStorage`.

### Phase 2 — test engine

- 60+ conformance checks across transport, JSON-RPC, lifecycle, capabilities, tools, resources, prompts, sampling, elicitation, utilities, authorization, security, tasks, hygiene, RC, discovery, stateless, subscriptions, caching, MRTR.
- Pluggable transports: streamable HTTP, legacy SSE, stdio (via `argus-bridge` WebSocket).
- `runScan` runner with per-check streaming progress, grading (A+ … F), and persisted scan history.
- ScanComposer, LiveProgress, GradeReveal, CategoryStrip, CheckCard, RawProtocolLog.

### Phase 3 — build engine

- Typed lattice canvas for composing MCP servers: server / tool / prompt / resource / capability nodes plus edges.
- 11 wired validation rules (no server, missing schema, name collision, etc.), each carrying a `spec://` reference.
- TypeScript and Python codegen with JSZip export.
- ValidationStrip with click-to-focus and inline spec deep-links.

### Phase 4 — learn tool

- DRAFT-2026-v1 spec rendered as a navigable, searchable in-app reference.
- SpecTree (left rail), SpecBody (rehype-prism syntax highlighting), SpecOutline (right rail).
- CommandPalette (⌘K) with fuzzy search over titles, excerpts, and anchor texts.
- `spec://` URL scheme + `?pulse=<anchor>` convention with IntersectionObserver-driven active-anchor tracking and 1.2s phosphor pulse on jump.
- Deep links from `/test` failed checks and `/build` validation issues.

### Phase 5 — stdio bridge

- `argus-bridge@0.1.0` published-shaped: `bin`, shebang preservation, npm-hygiene metadata.
- `--cmd "<command>"` one-shot mode for CI / sandboxed deployment.
- `--version` flag.
- `probeBridge()` browser-side readiness check.
- ScanComposer install hint + **Check bridge** button.
- End-to-end test: real `initialize` → `ping` round-trip through a real spawned echo server through a real WebSocket bridge.

### Phase 6 — polish & ship

- Empty states on `/`, `/build`.
- Error states: scan transport failure (with Retry), build-not-found, learn 404.
- Global keyboard navigation: `g h` `g t` `g b` `g l` with pending-prefix chip.
- Lazy-loaded check rows grouped by category, expand state persisted to prefs.
- Virtualized RawProtocolLog with paged backfill.
- Playwright happy-path: home → `g t` → run scan via stdio bridge → grade reveal.
- README walkthrough: "first scan in 60 seconds" + surfaces table.

### Tests

- 500+ unit tests (Vitest, jsdom).
- 1 Playwright happy-path (Chromium).

### Known limitations

- Static export only; no server runtime.
- No accessibility audit yet (Phase 7 candidate).
- No CI wiring for Playwright; local-only.
