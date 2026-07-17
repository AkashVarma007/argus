<div align="center">

<pre>
 █████╗ ██████╗  ██████╗ ██╗   ██╗███████╗
██╔══██╗██╔══██╗██╔════╝ ██║   ██║██╔════╝
███████║██████╔╝██║  ███╗██║   ██║███████╗
██╔══██║██╔══██╗██║   ██║██║   ██║╚════██║
██║  ██║██║  ██║╚██████╔╝╚██████╔╝███████║
╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝ ╚══════╝
</pre>

**🔭 The Model Context Protocol workbench — test any MCP server against a live conformance suite, compose a working server on a node canvas, and read the spec in-app. All in the browser. No backend.**

<p align="center">
  <a href="#-repository-map"><img alt="Packages" src="https://img.shields.io/badge/packages-4-2bf07f?style=flat-square"></a>
  <a href="argus/README.md"><img alt="App" src="https://img.shields.io/badge/app-Next.js%2015%20·%20React%2019-000000?style=flat-square&logo=nextdotjs&logoColor=white"></a>
  <a href="argus/README.md#-tests"><img alt="Tests" src="https://img.shields.io/badge/tests-522%20passing-2bf07f?style=flat-square&logo=vitest&logoColor=white"></a>
  <a href="#-the-three-tools"><img alt="Spec" src="https://img.shields.io/badge/spec-MCP%20DRAFT--2026--v1-2bf07f?style=flat-square"></a>
  <a href="#-architecture"><img alt="Backend" src="https://img.shields.io/badge/backend-none%20·%20localStorage-828b97?style=flat-square"></a>
  <a href="https://github.com/AkashVarma007/argus/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/AkashVarma007/argus/actions/workflows/ci.yml/badge.svg?branch=main"></a>
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-2bf07f?style=flat-square"></a>
</p>

</div>

> 🪫 Shipped an MCP server that "mostly works" and found out in production?
> **Argus** is the hundred-eyed workbench that watches every frame on the wire.
> This repository is the whole platform — the browser app plus the small
> companion binaries that let it reach servers a web page can't touch on its own.

<div align="center">

[Repository map](#-repository-map) &nbsp;•&nbsp; [The three tools](#-the-three-tools) &nbsp;•&nbsp; [Architecture](#-architecture) &nbsp;•&nbsp; [Quick Start](#-quick-start) &nbsp;•&nbsp; [Working on each package](#-working-on-each-package) &nbsp;•&nbsp; [Docs](#-docs--design) &nbsp;•&nbsp; [Status](#-status)

</div>

---

## 🗺️ Repository map

This is a **multi-package repo**, not a single app. Each package installs and builds on its own (independent `pnpm-lock.yaml` per package — there is no root workspace). The app is the star; everything else exists to serve it or test it.

```
MCP Builder/                 ← git root · the Argus platform
├── 🔭 argus/                the app — Next.js 15 SPA (Test · Build · Learn)
│   └── spec-source/draft/   vendored MCP DRAFT-2026-v1 spec (source for Learn + checks)
├── 🌉 argus-bridge/         WebSocket ↔ stdio relay — scan stdio-only servers
├── 🔀 argus-proxy/          CORS relay — scan cross-origin HTTP servers
├── 🧪 torture-server/       deliberately-broken MCP server (test fixture)
└── 📋 docs/                 design brief · conformance spec · platform spec + build plans
```

| Package | What it is | Needs a companion? | README |
|---------|------------|--------------------|--------|
| **`argus`** | The browser app. Static Next.js 15 SPA — three tools, three Zustand stores, everything in `localStorage`. | — | [argus/README.md](argus/README.md) |
| **`argus-bridge`** | Tiny Node CLI. Bridges a browser WebSocket to a spawned stdio MCP server so Argus can scan Claude Desktop plugins, local `node`/`python` binaries, etc. | is the companion | [argus-bridge/README.md](argus-bridge/README.md) |
| **`argus-proxy`** | Tiny Node CLI. A loopback CORS relay so Argus can scan HTTP servers that don't send `Access-Control-Allow-Origin`. | is the companion | [argus-proxy/README.md](argus-proxy/README.md) |
| **`torture-server`** | An intentionally-non-conformant MCP server used as the fixture the conformance checks are tested against (plus a clean variant the e2e smoke scan grades **A or better**). | — | — |

## 🔭 The three tools

Argus is three instruments in one dark panel. Full depth lives in [**argus/README.md**](argus/README.md); the short version:

| | | |
|---|---|---|
| 🔬 **Test** | *"Is my server correct?"* | Replays **67 conformance checks** across **20 categories** against a live endpoint (**HTTP · SSE · stdio**) and returns a graded report — **A+ … F** — with per-check evidence, the exact spec clause, and a copy-paste `curl` to reproduce. |
| 🧩 **Build** | *"Scaffold me a server."* | A pannable **node-graph canvas** where tools, prompts, and resources are nodes. Validates against the spec as you compose, then generates a runnable **TypeScript** or **Python** project and zips it in-browser. |
| 📖 **Learn** | *"What does the spec say?"* | The full **DRAFT-2026-v1** specification, vendored at build time — a searchable tree with `⌘K` fuzzy search and `spec://` deep links fired straight from a failed check. |

## 🏛️ Architecture

The app is a **static single-page app** — `next build` emits plain HTML/JS/CSS (`output: 'export'`). No server runtime, no database, no accounts, no telemetry. The browser talks to MCP servers directly over HTTP/SSE; the two companion binaries exist only to reach servers a web page fundamentally cannot.

```
        ┌──────────────────────────────────────────────────────────┐
        │  🔭 Argus SPA — Next.js 15 static export (localhost:3000) │
        │     Test · Build · Learn   →   💾 localStorage only        │
        └───────┬───────────────────┬───────────────────┬───────────┘
                │ fetch / SSE        │ WebSocket          │ HTTP POST
                ▼                    ▼                    ▼
       ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
       │ MCP server      │  │ 🌉 argus-bridge │  │ 🔀 argus-proxy  │
       │ (HTTP / SSE)    │  │ ws→stdio :7879  │  │ CORS relay :7878│
       └─────────────────┘  └────────┬────────┘  └─────────────────┘
                                     ▼
                            stdio MCP server
                        (node · python · plugin)
```

**Build** and **Learn** are fully browser-local. Only **Test** reaches out — directly for HTTP/SSE (through `argus-proxy` when CORS blocks it), or via `argus-bridge` for stdio, which a page can't spawn on its own.

## 🚀 Quick Start

> 🧰 **You will need:** Node.js **20+** · pnpm **9+**.
>
> ℹ️ The companion CLIs aren't published to npm yet — run them from source (as shown below). Once published, `npx argus-bridge` / `npx argus-proxy` will work from anywhere.

### 1️⃣ Run the app

```bash
cd argus
pnpm install
pnpm dev              # http://localhost:3000
```

Press `g t` for **Test**, `g b` for **Build**, `g l` for **Learn**.

### 2️⃣ Scan an HTTP server

Paste its URL into **Test → Endpoint**, keep transport on `streamable-http`, **Run scan**. Blocked by CORS? In another terminal:

```bash
cd argus-proxy && pnpm install && pnpm dev      # http://127.0.0.1:7878/proxy
```

…then paste that into **Test → Proxy URL**.

### 3️⃣ Scan a stdio server

```bash
cd argus-bridge && pnpm install && pnpm dev    # ws://127.0.0.1:7879/bridge
```

In the UI: transport → `stdio (via bridge)`, paste your server command (e.g. `node my-server.js` or `python -m my_server`), **Run scan**.

✅ **Verify:** the lattice fills one cell per check as results stream, then the grade arc draws and a letter pops into the hero.

### 4️⃣ Compose a server from scratch

`g b` → **+ New build** → drag **server / tool / prompt / resource** nodes → fill each inspector → **Generate** → download a runnable **TypeScript** or **Python** ZIP. Run it, then scan it back in **Test**.

## 🧑‍💻 Working on each package

Each package is self-contained — `cd` in, install, and use its own scripts.

```bash
# 🔭 the app
cd argus
pnpm install
pnpm dev            # dev server on :3000
pnpm test           # 522 unit tests (Vitest + jsdom)
pnpm build          # static export → ./out   (prebuild vendors the spec)
pnpm typecheck

# 🌉 the stdio bridge
cd argus-bridge
pnpm install && pnpm build      # tsc → dist/, chmod +x the CLI
pnpm test                       # server · spawn · cli · real-WebSocket e2e

# 🔀 the CORS proxy
cd argus-proxy
pnpm install && pnpm build
pnpm test

# 🧪 the test fixture
cd torture-server
pnpm install
pnpm dev            # runs the broken server for manual scanning
```

**Full E2E** (Playwright drives a real Chromium: home → `g t` → scan via a real bridge → grade reveal) — from `argus/`:

```bash
pnpm test:e2e:install
cd ../argus-bridge && pnpm install && pnpm build && cd ../argus
pnpm test:e2e
```

## 📚 Docs & design

| Path | What |
|------|------|
| [`docs/argus-design-brief.md`](docs/argus-design-brief.md) | The product & brand brief — audience, why it exists, the "dark instrument" design point of view. |
| [`docs/mcp-conformance-spec.md`](docs/mcp-conformance-spec.md) | Source catalog behind the conformance checks. |
| [`docs/superpowers/specs/`](docs/superpowers/specs/) | The platform design spec (visual tokens, architecture, screens, success criteria). |
| [`docs/superpowers/plans/`](docs/superpowers/plans/) | Phase-by-phase build plans (shell → test → build → learn → bridge → polish). |
| [`argus/spec-source/draft/`](argus/spec-source/draft/) | Vendored MCP DRAFT-2026-v1 spec — the source `pnpm sync-spec` renders into the Learn tool. |

## 🧭 Status

**Phases 1–6 complete** — a working browser-only MCP conformance, build, and learn platform. Per-phase detail and the full stack live in [`argus/README.md`](argus/README.md#-status) and [`argus/CHANGELOG.md`](argus/CHANGELOG.md).

**Known limitations** — static export only (no server runtime); no formal accessibility audit yet; Playwright is local-only (no CI wiring).

## 📄 License

Released under the [MIT License](LICENSE) — © 2026 Akash Varma. Do what you like; no warranty.

See [`CONTRIBUTING.md`](CONTRIBUTING.md) to get started, [`SECURITY.md`](SECURITY.md) to report a vulnerability, and the [Code of Conduct](CODE_OF_CONDUCT.md).

<div align="center">

**Built for the engineers who screenshot their tools. 🔭**

<sub>🟢 Every frame on the wire, watched.</sub>

</div>
