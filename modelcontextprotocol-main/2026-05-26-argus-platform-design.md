# Argus — Platform Design Spec

**Date**: 2026-05-26
**Status**: Draft for review
**Owner**: g.akashvarma@gmail.com

---

## 1. Summary

Argus is a single-page browser application that gives MCP (Model Context Protocol) engineers three tools in one interface:

1. **Test** — Run all 243 conformance checks (MCP DRAFT-2026-v1) against any MCP server, get a graded report.
2. **Build** — Visually compose a working MCP server from tools/prompts/resources, generate runnable TypeScript or Python code.
3. **Learn** — Browse and search the MCP specification.

No backend. No login. No accounts. All state in `localStorage`. Reports and generated code download as files.

The product is a **dark instrument workbench**: Workbench's tab-strip shell and spatial build canvas, fused with Lattice's deep navy-black surface and phosphor-green signal — a hybrid of two of the four design directions explored.

---

## 2. Audience and goals

**Audience** — Senior/staff engineers building MCP servers in 2026. They write TypeScript or Python. They recognize generic UI on sight. They will run Argus locally or open it on a public domain and try one scan in <60s.

**Goals** —
- Validate any MCP server (HTTP, SSE, stdio over WebSocket-bridge) end-to-end against the live spec.
- Generate a runnable server scaffold the user can `pnpm install && pnpm dev` or `uv run` immediately.
- Let the user navigate the spec without leaving the tool while they fix failures.

**Non-goals** —
- Hosting servers for users.
- Storing scan results or builds on a remote backend.
- Multi-user collaboration, sharing, accounts, notifications, billing.
- Mobile experience (desktop laptops + larger only).
- Editing arbitrary code in-browser (Build is a structured composer, not an IDE).

---

## 3. Visual direction

Hybrid of Workbench (chrome, spatial build canvas, diff results) on top of Lattice (surface, accent, brand mark, persistent 243-check lattice motif).

### Surface tokens

| Token        | Hex         | Purpose                          |
|--------------|-------------|----------------------------------|
| `paper`      | `#070d15`   | Deepest surface (observatory)    |
| `surface1`   | `#0d141e`   | Elevated card                    |
| `surface2`   | `#141d28`   | Raised input / hover             |
| `hairline`   | `#1f2531`   | 1px borders                      |
| `ink0`       | `#e8eef7`   | Brightest text                   |
| `ink1`       | `#c2cad6`   | Primary body                     |
| `ink2`       | `#828b97`   | Muted                            |
| `ink3`       | `#525a66`   | Tertiary                         |
| `ink4`       | `#3a414c`   | Dim                              |
| `signal`     | `#2bf07f`   | Phosphor green — affirmative + live state |
| `signal-dim` | `#0e3a23`   | Signal soft fill                 |
| `glow`       | `rgba(43,240,127,0.5)` | Signal glow            |

Failure is carried by **ink contrast + strikethrough + soft warn `#ffb4a8`**, never by red noise. Phosphor green is reserved for affirmative state (pass, live, connected, complete).

### Type

- UI sans — Inter (400, 500, 600, 700)
- Mono — JetBrains Mono (400, 500, 600, 700) — used for all data, IDs, timestamps, check names, numerics

### Chrome (every screen)

- **Title bar** (30px): bracket mark + `argus` wordmark + `workbench · v0.4.1` mono caption + LiveDot · connected + localStorage usage gauge
- **Tab strip** (32px): URI-like tabs (`scn-0142.report`, `github-readonly.build`, `spec://7.4`). Multi-tab navigation across the three tools.
- **Status footer** (24px): current scope, keyboard hint (`⌘K`), now-playing scan state

### Persistent motif

The **19×N lattice** is the brand element. It appears as:
- Brand mark (4×4 grid of dots, geometric)
- Status bar miniature (19 columns, color-stripe state per category)
- Hero element on results (full 19×N grid, 243 cells, one per check)
- Background watermark on empty states (faint, 4% opacity)

### Motion

Subtle, instrument-like, never decorative:
- Pulse (live dots, 1.6s)
- Draw (SVG path stroke for grade ring on reveal)
- Tick (numbers count up on result-arrival)
- Shimmer (running-scan progress)
- Caret blink (input fields)
- Wave (audio-like equalizer on streaming scan output)

---

## 4. Architecture

### Stack

- **Framework**: Next.js 15 (App Router), TypeScript, React 19
- **Build**: Static export (`output: 'export'`) — Argus is a static SPA. No server runtime.
- **Routing**: App Router with parallel routes for the three tools
- **State**: Zustand for in-memory app state, `localStorage` persistence via Zustand middleware
- **Styling**: CSS Modules + a small token system in `lib/tokens.ts`. No Tailwind (keeps bundle small, design control absolute)
- **Icons**: Custom SVG set (no icon library — keeps brand cohesive)
- **Fonts**: Inter + JetBrains Mono via `next/font/google`
- **Package manager**: pnpm
- **Testing**: Vitest for unit, Playwright for E2E

### Top-level structure

```
argus/
├── app/
│   ├── layout.tsx              # title-bar, tab-strip, footer chrome
│   ├── page.tsx                # home / dashboard
│   ├── test/
│   │   ├── page.tsx            # test runner input
│   │   └── [scanId]/page.tsx   # scan result (drill-in via search params)
│   ├── build/
│   │   ├── page.tsx            # build list
│   │   └── [buildId]/page.tsx  # build canvas
│   └── learn/
│       └── [...slug]/page.tsx  # spec browser
├── components/
│   ├── chrome/                 # title bar, tab strip, footer
│   ├── lattice/                # the 19×N motif, in variants
│   ├── ring/                   # grade arc, conic
│   ├── canvas/                 # build composer canvas
│   ├── primitives/             # button, input, panel, livedot
│   └── motion/                 # tick, shimmer, draw, wave
├── lib/
│   ├── conformance/            # 243 check definitions + runner
│   ├── generators/             # ts + py code generators
│   ├── spec/                   # mcp spec content (markdown + index)
│   ├── store/                  # zustand stores
│   ├── transport/              # mcp client (HTTP/SSE/WS-bridged-stdio)
│   └── tokens.ts               # design tokens
├── public/
│   ├── fonts/                  # self-host JBM + Inter as fallback
│   └── spec-source/            # raw mcp spec markdown
└── tests/
    ├── unit/
    └── e2e/
```

### State model

Three independent stores, all persisted to `localStorage`:

- `scansStore` — `{ scans: Record<ScanId, Scan> }`
- `buildsStore` — `{ builds: Record<BuildId, Build> }`
- `prefsStore` — `{ theme, lastTab, openTabs, recentEndpoints }`

`localStorage` quota: aim for <10MB total. Hard cap individual scan record at 200KB by truncating large failure response payloads.

### Data shapes

```ts
type ScanId = `SCN-${number}`
interface Scan {
  id: ScanId
  startedAt: ISODateString
  endpoint: string
  transport: 'http' | 'sse' | 'stdio-ws'
  spec: 'draft-2026-v1'
  durationMs: number
  grade: Grade            // A+ A A- B+ B B- C+ C C- D+ D F
  summary: { pass, fail, skip, error: number }
  results: CheckResult[]
}

interface CheckResult {
  checkId: string         // e.g. 'auth.bearer-token.scope-validation'
  category: CategoryId
  severity: 'critical' | 'major' | 'minor' | 'info'
  status: 'pass' | 'fail' | 'skip' | 'error'
  durationMs: number
  observed?: string       // truncated to 4KB
  expected?: string
  specRef?: string        // e.g. 'spec://7.4'
  fixHint?: string
}

interface Build {
  id: string              // slug, e.g. 'github-readonly'
  name: string
  language: 'typescript' | 'python'
  packageMeta: { name: string; version: string; description: string }
  tools: ToolDef[]
  prompts: PromptDef[]
  resources: ResourceDef[]
  modifiedAt: ISODateString
}
```

---

## 5. Conformance engine

### Catalog

243 checks across 19 categories. Each check is one TS module under `lib/conformance/categories/<category>/<check-id>.ts` exporting:

```ts
export interface CheckDef {
  id: string
  category: CategoryId
  severity: Severity
  description: string
  specRef: string
  applicableTo: ('http' | 'sse' | 'stdio')[]
  run(ctx: CheckContext): Promise<CheckResult>
}
```

`CheckContext` provides a typed MCP client and helpers (`expect`, `truncate`, `harvestResponse`). The runner orchestrates: discovers all checks via `import.meta.glob`, filters by applicable transport, runs in parallel batches (concurrency=8), streams results to the UI via a `ReadableStream`.

### 19 categories (v1, all 243 implemented)

| Category        | Approx count |
|-----------------|--------------|
| Transport       | 16           |
| JSON-RPC        | 14           |
| Lifecycle       | 11           |
| Authorization   | 18           |
| Security        | 12           |
| Discovery       | 19           |
| Tools           | 22           |
| Prompts         | 14           |
| Resources       | 17           |
| Sampling        | 9            |
| Roots           | 6            |
| Logging         | 11           |
| Statelessness   | 8            |
| Caching         | 14           |
| Routing         | 13           |
| Progress        | 8            |
| Cancellation    | 7            |
| Capabilities    | 12           |
| Error Codes     | 12           |

Total: **243**.

### Grading

Weighted by severity:
- critical fail: −4
- major fail: −2
- minor fail: −1
- info fail: −0.25

Score `S = 100 × (1 − totalPenalty / maxPossiblePenalty)` then bucketed:
A+ ≥ 97 · A 93–96 · A- 90–92 · B+ 87–89 · B 83–86 · B- 80–82 · C+ 77–79 · C 73–76 · C- 70–72 · D+ 65–69 · D 60–64 · F <60.

### Transport reach

- **HTTP** and **SSE**: direct from browser via `fetch` / `EventSource`. CORS-permitted servers only (Argus shows a clear warning + workaround when blocked).
- **stdio**: browser cannot spawn processes. Argus ships an optional **stdio bridge** (`argus-bridge`, a tiny ~50-line Node CLI published to npm) that exposes a local WebSocket relay, e.g. `npx argus-bridge --cmd "node my-server.js"`. Argus connects via `ws://localhost:7142`.

---

## 6. Build tool

### Composer model

A build is a structured document. The canvas exposes three primary surfaces:

- **Tools list** — name, description, JSON-Schema for input, optional output schema
- **Prompts list** — name, description, arguments
- **Resources list** — URI scheme, MIME type, description, sample resolver behaviour

Plus **package metadata** (name, version, description, license).

The user drops items from a palette into the canvas, edits each through a structured form. Schemas are written in a constrained mode (text-mode + visual-mode toggle). No raw code editing.

### Generators

Two generators in `lib/generators/`:

- `generators/typescript/` — emits a Node ESM project: `package.json`, `tsconfig.json`, `src/index.ts`, `src/tools/<name>.ts`, etc. Built on top of `@modelcontextprotocol/sdk` (TypeScript SDK). Includes `pnpm` scripts: `dev`, `build`, `start`.
- `generators/python/` — emits a `pyproject.toml` (uv-based) project: `src/<package>/__init__.py`, `src/<package>/server.py`, tools as separate modules. Built on top of `mcp` (Python SDK). Includes `uv run` entrypoint.

Both generate a `README.md` with the run instructions and a tiny `tests/` scaffold (one passing smoke test per generator).

Generators produce an in-memory `Map<string, string>` of `path → contents`. The browser zips via `jszip` and downloads via a Blob URL.

### Validation before generation

The generator first runs the build through the local **build-time validator** — a subset of 30–50 conformance checks that apply statically (schema validity, name uniqueness, JSON-Schema correctness, naming conventions). The user cannot generate until validation passes; failing checks render inline.

---

## 7. Learn tool

### Content source

The full MCP spec lives in `public/spec-source/draft-2026-v1/*.md`. Pulled from `modelcontextprotocol-main/docs/specification/draft/` at build time via a `scripts/sync-spec.ts` step that:
- Copies markdown files
- Strips Mintlify-specific front-matter, preserves anchors
- Builds a `spec-index.json` (title, slug, parent, body excerpt, anchor list) for the client search

### Browser

- Left rail: tree navigation from `spec-index.json`
- Center: rendered markdown with syntax-highlighted code (Prism, mono-tone phosphor-green-on-paper)
- Right rail: section outline + "links to checks that test this clause"
- Top: command palette (`⌘K`) — fuzzy search across titles + body, with mono-rendered result list

A failed check anywhere in the app exposes a `spec://7.4`-style click target that opens the Learn tool to that anchor in a new tab.

---

## 8. Screens (v1)

| Screen                    | Route                  | Purpose                                            |
|---------------------------|------------------------|----------------------------------------------------|
| Home / dashboard          | `/`                    | Recent scans, recent builds, tool entry            |
| Test — input              | `/test`                | New scan: endpoint + transport + options           |
| Test — scanning           | `/test/[scanId]?live=1`| Streaming progress, 19 categories filling          |
| Test — results overview   | `/test/[scanId]`       | Grade hero, 243-lattice, category summary          |
| Test — results drill-in   | `/test/[scanId]?cat=auth` | One category expanded, failed checks + fixes    |
| Build — list              | `/build`               | All saved builds                                   |
| Build — canvas            | `/build/[buildId]`     | Compose tools/prompts/resources                    |
| Build — generation        | `/build/[buildId]?gen=1` | Validation review, language toggle, download    |
| Learn                     | `/learn/[...slug]`     | Spec browser                                       |
| Empty states              | (every route)          | First-time / no-data variants                      |
| Error / loading           | (every route)          | Loading, fetch error, CORS, bridge-not-running     |

---

## 9. Critical UX moments

These five moments are the product's defining experiences and require explicit motion design:

1. **Scan starts** — title bar `connected` indicator turns phosphor green and pulses faster, lattice cells start lighting one-by-one as each check resolves, hero counter ticks up
2. **Grade reveal** — when scan completes, the grade arc draws its arc over 600ms, the letter (`B+` 80px) fades in with `pop`, the lattice locks final state
3. **Drill-in** — clicking a category zooms the lattice; failed cells expand to rows
4. **Build generation** — file tree builds left-to-right with `tick` animation, "Download ZIP" button materializes when ready
5. **Spec deep-link** — clicking `spec://x.y` opens a new tab with the anchor scrolled into view + a phosphor underline pulse on the relevant clause

---

## 10. Project scaffolding plan

Target path: `/home/nishanth/Desktop/Personal/Akash/MCP Builder/argus/`

Phase 1 — Shell:
- Next.js init, App Router, TypeScript, static export
- Token system (`lib/tokens.ts`)
- Chrome components (title bar, tab strip, footer)
- Routing scaffold for all 11 screens (mocked content)
- Zustand stores with `localStorage` persistence

Phase 2 — Test tool:
- Conformance check catalog interface
- Implement all 243 checks (split across multiple subagents)
- Runner with parallel execution + streaming
- HTTP and SSE transports
- Results UI: hero, lattice, drill-in
- Report download (JSON, HTML, Markdown)

Phase 3 — Build tool:
- Canvas: tools/prompts/resources composer
- Form editors for each artifact
- Build-time validator (30–50 check subset)
- TS generator
- Python generator
- ZIP packaging and download

Phase 4 — Learn tool:
- Spec sync script
- Index build
- Browser UI (tree + body + outline)
- Command palette search
- Deep-link integration

Phase 5 — stdio bridge:
- `argus-bridge` Node CLI
- Published to npm
- Auto-detect prompt in Argus when stdio selected

Phase 6 — Polish + ship:
- Empty states for every route
- Error states + recovery
- Keyboard shortcuts (`⌘K`, `g h`, `g t`, `g b`, `g l`)
- Performance: lazy-load checks by category, virtualize large lists
- E2E happy-path tests in Playwright

---

## 11. Open questions

| #   | Question                                                                                  | Default if unanswered             |
|-----|-------------------------------------------------------------------------------------------|-----------------------------------|
| OQ1 | stdio bridge — ship in repo or separate package?                                          | Same repo, separate workspace     |
| OQ2 | Spec content version: sync once vs. ongoing CI sync from modelcontextprotocol repo?       | One-time sync v1, CI in v2        |
| OQ3 | Theme: dark-only or also light variant?                                                   | Dark-only v1                      |
| OQ4 | Auth flows for testing: does Argus inject test bearer tokens, or only test what user supplies? | User supplies; Argus does not generate credentials |
| OQ5 | How to display 243 cells without scrolling on 1440×900? Adaptive cell size or grouped?    | Adaptive cell size, 19 rows fixed |
| OQ6 | Build canvas: node-graph (Workbench) or stacked-list (simpler)?                            | Stacked list v1, node-graph later |
| OQ7 | Generated server license: MIT default, user-configurable?                                 | MIT default, configurable         |

---

## 12. Success criteria

The work is shipped when:

- All 243 checks run end-to-end against the official Anthropic MCP reference server (`mcp.anthropic.com`) and produce a grade
- A user can compose a tool, generate TS code, run `pnpm install && pnpm dev` on the downloaded ZIP, and have it serve a live MCP endpoint
- A user can search the spec from `⌘K` and reach a clause in under 2 seconds
- The shell loads in <2s on a cold cache (no main-thread blocking >50ms)
- A scan of 100 checks completes in <30 seconds on a local-network MCP server
- Lighthouse score ≥ 95 on Performance and Accessibility

---

End spec.
