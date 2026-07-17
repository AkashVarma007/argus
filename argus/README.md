<div align="center">

<pre>
 █████  ██████   ██████ ██   ██ ██████
██   ██ ██   ██ ██      ██   ██ ██
███████ ██████  ██  ███ ██   ██ ██████
██   ██ ██   ██ ██   ██ ██   ██     ██
██   ██ ██   ██  ██████  █████  ██████
</pre>

**🔭 A browser-native instrument for the Model Context Protocol — scan any MCP server against a live conformance suite, compose a working server on a node canvas, and read the spec without leaving the tab. 🟢**

<p align="center">
  <a href="https://nextjs.org"><img alt="Next.js" src="https://img.shields.io/badge/next.js-15-000000?style=flat-square&logo=nextdotjs&logoColor=white"></a>
  <a href="https://react.dev"><img alt="React" src="https://img.shields.io/badge/react-19-61dafb?style=flat-square&logo=react&logoColor=black"></a>
  <a href="https://typescriptlang.org"><img alt="TypeScript" src="https://img.shields.io/badge/typescript-5.7-3178c6?style=flat-square&logo=typescript&logoColor=white"></a>
  <a href="https://zustand.docs.pmnd.rs"><img alt="Zustand" src="https://img.shields.io/badge/zustand-5-2d3748?style=flat-square"></a>
  <a href="#-tests"><img alt="Tests" src="https://img.shields.io/badge/tests-522%20passing-2bf07f?style=flat-square&logo=vitest&logoColor=white"></a>
  <a href="#-conformance-catalog"><img alt="Spec" src="https://img.shields.io/badge/spec-MCP%20DRAFT--2026--v1-2bf07f?style=flat-square"></a>
  <a href="#-architecture"><img alt="Backend" src="https://img.shields.io/badge/backend-none%20·%20localStorage-828b97?style=flat-square"></a>
</p>

</div>

> 🪫 Shipped an MCP server that "mostly works" and found out in production?
> Argus is the **hundred-eyed** workbench that watches every frame on the wire.
> Point it at any MCP endpoint — **HTTP, SSE, or stdio** — and it replays a graded
> conformance suite in seconds. Or compose a fresh server on a spatial canvas and
> walk away with runnable **TypeScript or Python**. All of it runs in your browser.
> No backend. No account. No telemetry. Your state never leaves `localStorage`. 🟢

<div align="center">

[Why](#-why-argus) &nbsp;•&nbsp; [Architecture](#-architecture) &nbsp;•&nbsp; [Quick Start](#-quick-start) &nbsp;•&nbsp; [Test](#-test--the-conformance-scanner) &nbsp;•&nbsp; [Build](#-build--the-server-composer) &nbsp;•&nbsp; [Learn](#-learn--the-spec-browser) &nbsp;•&nbsp; [Companions](#-companion-packages) &nbsp;•&nbsp; [Tests](#-tests) &nbsp;•&nbsp; [Troubleshooting](#-troubleshooting)

</div>

---

## ✨ Why Argus

MCP is young and the spec moves fast. The engineers building on it in 2026 have three recurring problems — Argus is three tools that answer them, fused into one dark instrument panel.

| | | |
|---|---|---|
| 🔬 **Test** | *"Is my server correct?"* | Replays **67 conformance checks** across **20 categories** against a live endpoint and hands back a graded report — **A+ … F** — with per-check evidence, the exact spec clause, and a copy-paste `curl` to reproduce. |
| 🧩 **Build** | *"Scaffold me a server."* | A pannable **node-graph canvas** where tools, prompts, and resources are nodes. Validates against the spec as you compose, then generates a runnable **TypeScript** or **Python** project and zips it in the browser. |
| 📖 **Learn** | *"What does the spec actually say?"* | The full **DRAFT-2026-v1** specification, vendored at build time — a searchable tree with `⌘K` fuzzy search and `spec://` deep links fired straight from a failed check. |

The design target is Linear, Raycast, Datadog — not a Bootstrap admin template. Deep navy-black observatory surface, a single **phosphor-green** signal reserved for affirmative state, failure carried by ink contrast and strikethrough rather than red noise, and a persistent **lattice** motif — one cell per check.

## 🗺️ Architecture

Argus is a **static single-page app**. `next build` emits a folder of HTML/JS/CSS (`output: 'export'`) that runs from any static host or `file://`. There is no server runtime, no database, no API to stand up.

```
        ┌──────────────────────────────────────────────────────────┐
        │  🖥️  Argus SPA — Next.js 15 static export (localhost:3000) │
        │                                                            │
        │  ┌────────── chrome ──────────┐   TitleBar · TabStrip ·    │
        │  │ 🔬 Test   🧩 Build  📖 Learn │   Footer · KeyboardNav    │
        │  └────────────────────────────┘   (g h · g t · g b · g l)  │
        │                                                            │
        │  lib/conformance ── 67 typed checks → runner → grade A+…F   │
        │  lib/build ─────── node graph → 12 validators → codegen     │
        │  lib/codegen ───── TS + Python emitters → JSZip download    │
        │  lib/learn ─────── fuse.js search over vendored spec index  │
        │  lib/store ─────── 3 Zustand stores ⇄ 💾 localStorage       │
        └───────┬───────────────────┬───────────────────┬───────────┘
                │ fetch / SSE        │ WebSocket          │ HTTP POST
                ▼                    ▼                    ▼
       ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
       │ MCP server      │  │ 🌉 argus-bridge │  │ 🔀 argus-proxy  │
       │ (streamable     │  │ ws→stdio relay  │  │ CORS relay for  │
       │  HTTP / SSE)    │  │ :7879           │  │ x-origin :7878  │
       └─────────────────┘  └────────┬────────┘  └─────────────────┘
                                     ▼
                            stdio MCP server
                        (node · python · plugin)
```

The browser can reach HTTP/SSE servers directly. **stdio** servers (Claude Desktop plugins, local `node`/`python` binaries) can't be spawned from a page — so Argus ships a tiny **`argus-bridge`** WebSocket↔stdio relay. Cross-origin HTTP servers that don't send CORS headers can be reached through the equally-tiny **`argus-proxy`**. Both are optional; Build and Learn need neither.

## 🧱 Stack

| Layer | Choice | Why |
|-------|--------|-----|
| 🖼️ Framework | **Next.js 15** · App Router · React 19 · static export | SPA with zero server runtime |
| 🎨 Styling | **CSS Modules** + `lib/tokens.ts` — *no Tailwind* | Absolute design control, tiny bundle |
| 🗄️ State | **Zustand 5** + `persist` middleware over `localStorage` | Three independent stores, no backend |
| 🔡 Type | **Inter** + **JetBrains Mono** via `next/font` | Mono for every ID, timestamp, and check name |
| ✅ Schema | **ajv** + **ajv-formats** | JSON-Schema validation for tool input/output |
| 📡 SSE | **eventsource-parser** | Legacy SSE transport framing |
| 🔎 Search | **fuse.js** | Fuzzy `⌘K` over the spec index |
| 📦 Codegen | **jszip** | Zips the generated project client-side |
| 📄 Spec render | **react-markdown** · **rehype-prism-plus** · **rehype-slug** · **remark-gfm** | Syntax-highlighted, anchor-linked spec |
| 🧪 Tests | **Vitest** (jsdom) · **Playwright** | 522 unit + e2e happy-path |
| 📦 Toolchain | **pnpm 9** · **TypeScript 5.7** · ESM throughout | |

## 🚀 Quick Start

> 🧰 **You will need:** Node.js **20+** · pnpm **9+**. *(Node 20+ only if you also run `argus-bridge`.)*

### 1️⃣ Install

```bash
pnpm install
```

✅ **Verify:** `node_modules/` appears and install exits clean.

### 2️⃣ Run the dev server

```bash
pnpm dev            # http://localhost:3000
```

✅ **Verify:** the shell loads — a 30px title bar with the bracket mark + `argus` wordmark, a tab strip (`home · test · build · learn`), and a live status footer.

### 3️⃣ First scan in 60 seconds

Press `g t` (or click **test**) to reach `/test`.

- **HTTP server?** Paste its URL into **Endpoint**, leave transport on `streamable-http`, click **Run scan**.
- **stdio server?** In another terminal:
  ```bash
  npx argus-bridge          # ws://127.0.0.1:7879/bridge
  ```
  Then in the UI: transport → `stdio (via bridge)`, paste your server command (e.g. `node my-server.js` or `python -m my_server`), click **Run scan**.

✅ **Verify:** the lattice fills one cell per check as results stream in, then the grade arc draws and a letter (`A-`, `B+`, …) pops into the hero.

### 4️⃣ Or compose a server from scratch

1. Press `g b` → **/build** → **+ New build**.
2. Drag **server / tool / prompt / resource** nodes from the left rail onto the canvas.
3. Click a node → fill its schema in the right-rail inspector (visual form *or* raw JSON).
4. **Generate** → pick TypeScript or Python → **Download ZIP**.

✅ **Verify:** the downloaded project runs — `pnpm install && pnpm dev` (TS) or `uv run <name>` (Python) — and serves a live MCP endpoint you can immediately scan back in **Test**.

## 🔬 Test — the conformance scanner

### How a scan runs

1. You supply an **endpoint** + **transport** (`streamable-http` · `legacy SSE` · `stdio via bridge`), optionally a proxy URL and a protocol version (`DRAFT-2026-v1` or `2025-11-25`).
2. Argus builds an `McpClient` over the chosen `Transport`, runs `initialize` + `notifications/initialized`, and harvests the server's declared **capabilities**.
3. The **runner** (`lib/conformance/runner.ts`) walks the catalog. Each check is **skipped** if it doesn't apply to the negotiated spec version or if a `requires` capability is absent — otherwise it runs and streams a `start → pass|fail|skip|error` progress event to the UI.
4. Every check attaches **evidence**: the request, the response, expected-vs-actual, notes, and a reproduction `curl`.
5. The report is graded, summarized, and persisted to `localStorage` as a `SCN-*` record.

### Anatomy of a check

Every check is a typed `Check` module under `lib/conformance/checks/<category>/<ID>/check.ts`:

```ts
const check: Check = {
  id: 'TL-01',
  category: 'tools',
  severity: 'error',              // error | warning | info
  confidence: 'high',             // high | medium | heuristic
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Every tool has name, description, inputSchema',
  probe: 'List tools; inspect every entry for required fields.',
  criterion: 'Each tool MUST have string name, string description, object inputSchema.',
  specRef: { url: '…/server/tools', section: 'Tool definition', quote: '…' },
  requires: ['tools'],            // skipped if capability undeclared
  deterministic: true,
  async run(ctx) {
    const { result, error } = await ctx.client.call('tools/list', {})
    // …inspect, return { status, message, evidence }
  },
}
```

`CheckContext` hands each check a typed `McpClient`, a `RawHttpClient` for header/status-level assertions, the negotiated `capabilities`, and a `log()` sink.

### Conformance catalog

**67 checks across 20 categories.** Every check maps to a quoted clause of the spec and can deep-link into the **Learn** tool.

| Category | # | What it proves | Category | # | What it proves |
|----------|:-:|----------------|----------|:-:|----------------|
| `transport` | 6 | Content-type, framing, `202` on notifications, protocol-version header | `jsonrpc` | 9 | `2.0` envelope, id echo, result⊕error, error shapes/codes |
| `lifecycle` | 5 | `initialize` result, `serverInfo` types, version echo, `ping` | `capabilities` | 6 | Declared lists resolve; undeclared capability is rejected |
| `tools` | 5 | Tool shape, schema validity, unique names, error on bad input | `resources` | 3 | Resource shape, unknown-URI handling, content types |
| `prompts` | 2 | Prompt shape, `prompts/get` argument handling | `sampling` | 2 | Capability declared, back-request shape |
| `elicitation` | 2 | Capability declared, form-or-URL mode | `utilities` | 3 | Progress tokens, cancellation, logging levels |
| `authorization` | 4 | `401` when unauthenticated, `WWW-Authenticate`, PRM, no token-in-URL | `security` | 2 | Origin validation, TLS required |
| `tasks` | 2 | Task support declared, status polling | `hygiene` | 3 | Helpful errors, consistent types, no stack traces |
| `discovery` | 2 | `/.well-known/mcp`, CORS preflight | `rc` | 3 | DRAFT-2026 support, typed icons, URL-mode elicitation |
| `stateless` | 2 | No session cookie, identical result after reconnect | `subscriptions` | 2 | `resources/subscribe`, unsubscribe stops events |
| `caching` | 2 | List stable without `listChanged`, changes after touch | `mrtr` | 2 | Metadata shape, transport spec |

### Grading

The grade is driven by the **pass ratio of `error`-severity checks**, with `warning`-severity checks acting as the tie-break for the top bucket (`lib/conformance/grading.ts`):

| Grade | Error-check pass ratio | | Grade | Ratio |
|:-----:|:----------------------:|---|:-----:|:-----:|
| **A+** | 1.00 *(and all warnings pass)* | | **B-** | ≥ 0.80 |
| **A**  | ≥ 0.98 | | **C+** | > 0.75 |
| **A-** | ≥ 0.95 | | **C**  | ≥ 0.70 |
| **B+** | ≥ 0.90 | | **C-** | ≥ 0.60 |
| **B**  | ≥ 0.85 | | **D**  | ≥ 0.50 · **F** < 0.50 |

Skipped checks (wrong spec version / undeclared capability) never count against the score.

## 🧩 Build — the server composer

A build is a **spatial node graph**, not a text file. The canvas is pannable and zoomable; node positions and viewport are saved to the build doc so re-opening restores the layout exactly.

**Node types** — `server` (single, the package root) · `tool` · `prompt` · `resource` · `capability` (derived, read-only).
**Edge kinds** — `membership` (artifact → server, drawn faint) · `dependency` (tool → tool) · `prompt-uses-tool`.

### Validate-before-generate

`lib/build/validate.ts` runs **12 static rules** on every change, each carrying a `spec://` reference so an issue is one click from the relevant clause. `error`-severity issues **block** codegen; `warning`s are advisory.

- ⛔ No server node · more than one server node · edge referencing a missing node
- ⛔ Duplicate tool / prompt / resource (after slugify) · tool missing or invalid `inputSchema` · capability node missing `exposes`
- ⚠️ Tool with no description · membership edge not wired to the server · `prompt-uses-tool` pointing at a non-tool · non-semver package version

### Codegen

Two emitters in `lib/codegen/`. Both return an in-memory `path → contents` map; the browser zips via **jszip** and downloads through a Blob URL — nothing is uploaded.

| Target | Emits | Built on | Run it |
|--------|-------|----------|--------|
| 🟦 **TypeScript** | `package.json`, `tsconfig.json`, entrypoint, server wiring, one module per tool/prompt/resource, `README.md`, `.gitignore` — JSON-Schema compiled to **Zod** | `@modelcontextprotocol/sdk` ^1 · `zod` ^3 · ESM | `pnpm install && pnpm dev` |
| 🐍 **Python** | `pyproject.toml` (hatchling, `requires-python >=3.10`), server module, per-artifact modules — JSON-Schema mapped to Python types | `mcp` >=1 · uv-style | `uv run <name>` |

## 📖 Learn — the spec browser

The full **DRAFT-2026-v1** spec is **vendored at build time**. `pnpm prebuild` runs `scripts/sync-spec.ts`, which reads `../modelcontextprotocol-main/docs/specification/draft/**/*.{md,mdx}`, strips Mintlify front-matter (preserving anchors), and writes `public/spec-source/draft-2026-v1/<slug>.md` plus a `spec-index.json` (tree + excerpts + anchor texts) for client-side search.

- **Left rail** — `SpecTree`, the section hierarchy from the index.
- **Center** — `SpecBody`, rendered markdown with rehype-prism syntax highlighting.
- **Right rail** — `SpecOutline`, in-page section jumps.
- **`⌘K`** — `CommandPalette`, fuse.js fuzzy search weighted across titles, excerpts, and anchor text.
- **Deep links** — a failed check or build issue exposes a `spec://…` target; opening it scrolls the anchor into view (`IntersectionObserver` tracks the active anchor) and fires a **1.2s phosphor pulse** on the landed clause (`?pulse=<anchor>`).

## 🌉 Companion packages

Both live beside `argus/` in the monorepo and are published shaped for `npx`. **You only need them for the Test tool** — Build and Learn are fully browser-local.

### `argus-bridge` — WebSocket ↔ stdio relay

Lets the browser scan stdio-only servers. Opens `ws://<host>:<port>/bridge?exec=<argv>&protocol=<spec>`, spawns the subprocess, and pumps text frames ↔ stdin/stdout line-by-line.

```bash
npx argus-bridge                              # ws://127.0.0.1:7879/bridge
npx argus-bridge --port 8000                  # custom port
npx argus-bridge --cmd "node server.js"       # pin one command, ignore ?exec= (CI-safe)
npx argus-bridge --allow-shell                # permit shell metacharacters in exec
```

| Flag | Default | Notes |
|------|---------|-------|
| `-p, --port` | `7879` | Listen port |
| `-h, --host` | `127.0.0.1` | Loopback by default |
| `--cmd` | *(unset)* | Fixed server argv; overrides `?exec=` — safest for shared deploys |
| `--allow-shell` | `false` | Permit `;\|&\`$<>` in exec strings |
| `--version` | — | Print version and exit |

Close codes signal intent to Argus's readiness probe: `4001` exec missing (probe OK) · `4002` exec parse failed · `4003` child exited · `1011` spawn error. Child **stderr never reaches the browser** — it's logged bridge-side for the operator. Argv is parsed argv-style; shell metacharacters are rejected unless `--allow-shell`. Requires Node **20+**.

### `argus-proxy` — CORS relay for cross-origin HTTP

For HTTP servers that don't send CORS headers. `POST /proxy` with `{ url, init }`; the proxy forwards and echoes the response with `Access-Control-Allow-Origin: *`.

```bash
npx argus-proxy                    # http://127.0.0.1:7878/proxy
npx argus-proxy --allow-private    # permit private-network targets (trusted networks only)
```

Bound to `127.0.0.1`; refuses private/link-local IPv4 + IPv6 ranges unless `--allow-private`. Paste the proxy URL into **Test → Proxy URL**.

### `torture-server` — the test fixture

A **deliberately-broken** MCP server (`torture-server/`) used as a fixture across the conformance check tests, plus a clean variant the e2e smoke test scans to assert it scores **A or better**.

## 🗂️ Project Layout

```
argus/
├── app/                    Next.js App Router — home · test · build · learn
│   ├── layout.tsx          🎛️  title-bar / tab-strip / footer / keyboard-nav chrome
│   └── {test,build,learn}/ route trees + client views
├── components/
│   ├── chrome/             🖥️  TitleBar · TabStrip · Footer · KeyboardNav
│   ├── lattice/            🔲 the per-check lattice motif (Mark · MiniStrip)
│   ├── test/               🔬 ScanComposer · LiveProgress · GradeReveal · CheckCard · RawProtocolLog
│   ├── build/              🧩 Canvas · Palette · NodeShape · Inspector · ValidationStrip · GenerateModal
│   ├── learn/              📖 SpecTree · SpecBody · SpecOutline · CommandPalette · AnchorPulse
│   └── primitives/         🧱 Button · Input · Panel · LiveDot · EmptyState
├── lib/
│   ├── conformance/        67 typed checks · runner · grading · McpClient · transports · helpers
│   ├── build/              node-graph schema · factory · 12 validators · slug
│   ├── codegen/            TS + Python emitters · zip · download
│   ├── learn/              spec index/body hooks · fuse.js search · href
│   ├── store/              scans · builds · prefs (Zustand + localStorage)
│   └── tokens.ts           🎨 design tokens (Lattice-on-Workbench palette)
├── public/spec-source/     vendored DRAFT-2026-v1 markdown + spec-index.json
├── scripts/sync-spec*      spec vendoring (front-matter strip · anchors · tree · index)
└── tests/{unit,e2e}/       522 Vitest + Playwright happy-path
```

## 🎹 Keyboard

| Keys | Action | | Keys | Action |
|------|--------|---|------|--------|
| `g h` | Home | | `g b` | Build |
| `g t` | Test | | `g l` | Learn |
| `⌘K` | Spec search (in Learn) | | | |

A pending-prefix chip appears after `g` so the second key is discoverable.

## 🧰 Scripts

```bash
pnpm dev                 # next dev — http://localhost:3000
pnpm build               # prebuild syncs spec → static export to ./out
pnpm start               # serve the production build
pnpm sync-spec           # re-vendor the spec from ../modelcontextprotocol-main/
pnpm test                # unit — Vitest (jsdom)
pnpm test:watch          # unit in watch mode
pnpm test:e2e            # Playwright happy-path (see below)
pnpm test:e2e:install    # one-time: download Chromium
pnpm typecheck           # tsc --noEmit
```

## ✅ Tests

```bash
pnpm test        # 522 unit tests · 90 files · Vitest + jsdom
```

**522 unit tests, all green** 💚 — covering every conformance check against the torture-server fixture, the grader, all transports, the build validators, both codegen emitters (with a generate-then-parse round-trip), the learn search/index, and the React components. An in-suite **e2e smoke** test spawns the clean torture-server and asserts a real scan grades **A or better**.

```bash
# Playwright happy-path: home → g t → scan via argus-bridge → grade reveal
pnpm test:e2e:install
cd ../argus-bridge && pnpm install && pnpm build && cd ../argus
pnpm test:e2e
```

Spawns a real `argus-bridge` against an in-tree stub MCP server and drives a real Chromium end-to-end. See `tests/e2e/README.md`.

## 🌱 Ports & Config

| Thing | Default | Where |
|-------|---------|-------|
| Dev server | `http://localhost:3000` | `next dev` |
| Static export | `./out/` | `next build` (`output: 'export'`) |
| `argus-bridge` | `ws://127.0.0.1:7879/bridge` | companion CLI |
| `argus-proxy` | `http://127.0.0.1:7878/proxy` | companion CLI |
| All app state | browser `localStorage` | `scansStore` · `buildsStore` · `prefsStore` |

No `.env`, no secrets, no config file. Everything the app remembers — scan history, saved builds, open tabs, expand state — lives in `localStorage` and can be wiped from the browser's dev tools.

## 🩹 Troubleshooting

<details>
<summary><b>Scan fails instantly / "failed to fetch" on an HTTP server</b></summary>

The server is almost certainly not sending CORS headers, so the browser blocks the cross-origin request. Run `npx argus-proxy` and paste `http://127.0.0.1:7878/proxy` into **Test → Proxy URL**.
</details>

<details>
<summary><b>stdio transport won't connect</b></summary>

The browser can't spawn processes — you need the bridge. Run `npx argus-bridge`, confirm it logs `ws://127.0.0.1:7879/bridge`, then use the **Check bridge** button in the scan composer. If it still fails, your server command may contain shell metacharacters; either simplify it or start the bridge with `--allow-shell`.
</details>

<details>
<summary><b>Every check comes back "skip"</b></summary>

Checks skip when they don't apply to the negotiated protocol version, or when the server didn't declare the capability they need (`requires`). Confirm `initialize` succeeded and the server's `capabilities` actually advertise `tools`/`resources`/`prompts`/etc. — the lifecycle checks will show you the raw `initialize` result.
</details>

<details>
<summary><b>Build won't generate</b></summary>

Generation is blocked while any `error`-severity validation issue is open. Check the **ValidationStrip** — most often it's a missing server node, a tool with no `inputSchema`, or a duplicate name after slugify. Click the issue to focus the offending node.
</details>

<details>
<summary><b>Learn is empty / spec 404s</b></summary>

The spec is vendored at build time from `../modelcontextprotocol-main/`. If that sibling checkout is missing, `pnpm sync-spec` has nothing to copy. Clone the MCP spec repo next to `argus/` and re-run `pnpm sync-spec` (or `pnpm build`, which runs it via `prebuild`).
</details>

<details>
<summary><b>Wipe all state and start fresh</b></summary>

Everything is in `localStorage`. Open dev tools → Application → Local Storage → clear the origin, or run `localStorage.clear()` in the console. There is no server-side state to reset.
</details>

## 🧭 Status

Phases 1–6 complete. Argus is a browser-only MCP conformance, build, and learn platform:

- **Phase 1 — shell** · Lattice frame, TitleBar, TabStrip, CommandPalette, Zustand stores over `localStorage`.
- **Phase 2 — test engine** · 67 checks across 20 categories, three transports, streaming runner, grading, persisted history.
- **Phase 3 — build engine** · typed node canvas, 12 validators with `spec://` refs, TS + Python codegen, JSZip export.
- **Phase 4 — learn tool** · vendored spec, tree/body/outline, `⌘K` search, `spec://` deep links with anchor pulse.
- **Phase 5 — stdio bridge** · `argus-bridge` with `--cmd` one-shot mode and a browser-side readiness probe.
- **Phase 6 — polish** · empty + error states, `g`-prefix keyboard nav, lazy category groups, virtualized protocol log, Playwright happy-path.

**Known limitations** — static export only (no server runtime); no formal accessibility audit yet; Playwright is local-only (no CI wiring).

## 📄 License

The companion packages (`argus-bridge`, `argus-proxy`) declare **MIT**. The main `argus` app is currently marked `private` with no `LICENSE` file committed — treat it as all-rights-reserved until one lands.

<div align="center">

**Built for the engineers who screenshot their tools. 🔭**

<sub>🟢 Every frame on the wire, watched.</sub>

</div>
