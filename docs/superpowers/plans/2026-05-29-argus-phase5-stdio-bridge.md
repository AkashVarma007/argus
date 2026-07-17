# Phase 5 — Stdio Bridge

Status: planned (execution started 2026-05-29).

## 1. Goal

Ship `argus-bridge` as a publishable, locally-runnable Node CLI that lets the browser-based Argus scanner reach a stdio MCP server through a WebSocket relay. Bring the existing scaffold to a usable state and surface it in the Argus UI so the first-time stdio user can succeed without digging through docs.

The bridge package is at `argus-bridge/`. The browser transport is already wired (`argus/lib/conformance/transport/bridge.ts`).

## 2. Current state

What already works:
- `argus-bridge/src/server.ts` — HTTP server with WS upgrade on `/bridge`; parses `?exec=&protocol=`; spawns a child via `parseExec` + `spawnChild`; pipes WS↔stdio line-by-line; close codes 4001/4002/4003.
- `argus-bridge/src/spawn.ts` — execve-style argv tokeniser with shell-metachar denylist and `--allow-shell` escape.
- `argus-bridge/src/cli.ts` — commander-driven CLI: `--port` `--host` `--allow-shell`.
- 10/10 tests pass (`pnpm test`).
- Browser transport in `argus/` constructs `${bridgeUrl}?exec=...&protocol=...`.

What's missing:
- `pnpm build` in `argus-bridge` not yet verified end-to-end (no `dist/`).
- `bin` shebang preservation across `tsc` output.
- npm-publish hygiene: keywords, repo URL, homepage, README polish.
- Argus UI: no in-app affordance for "spin up the bridge", no readiness check, no friendly empty state when bridge isn't reachable.
- No happy-path E2E smoke test that round-trips a real JSON-RPC `initialize` through the bridge against a tiny in-tree stdio echo server.

## 3. Scope

Phase 5 ships:
1. A `dist/`-buildable, publishable `argus-bridge` package with a working CLI binary.
2. A small E2E smoke test (bridge + node-spawned stdio MCP echo server) that exercises a real `initialize`/`notifications/initialized`/`shutdown` round trip.
3. UX surface in Argus:
   - When `Transport=stdio (via bridge)` is selected, show a hint block with the exact `npx argus-bridge --port N` command.
   - A small "Check bridge" button that performs a no-op WS connection to confirm reachability before launching the scan.

Phase 5 explicitly does **not**:
- Actually publish to npm (user task; we just make it publishable).
- Build a GUI for picking exec commands; the existing text field is fine.
- Add auth/origin gating beyond what's already there. Bridge stays loopback by default.

## 4. Layout

```
argus-bridge/
  src/
    cli.ts                # add --version flag, --cmd one-shot mode
    server.ts             # (already done — minor: pass through onConnection logger hook)
    spawn.ts              # (no changes)
  tests/
    e2e.test.ts           # new — round-trip via bridge against tiny echo server
  scripts/
    echo-server.mjs       # new — tiny stdio JSON-RPC echo used by e2e.test.ts
  README.md               # rewrite for publish
  package.json            # add keywords, repository, homepage, prepublishOnly script
  tsconfig.json           # ensure "outDir": "./dist", "rootDir": "./src"

argus/
  components/test/
    ScanComposer.tsx          # (modified) hint block + readiness check when stdio
    ScanComposer.module.css   # styling for hint block
  lib/conformance/transport/
    bridge.ts                 # (modified) export probeBridge(url): Promise<'ok' | string>
  tests/unit/
    test/ScanComposer.test.tsx              # extended
    conformance/bridge-probe.test.ts        # new
```

## 5. Tasks

### Task 1: Bridge `--cmd` one-shot mode

**Files modified:**
- `argus-bridge/src/server.ts`
- `argus-bridge/src/cli.ts`

**Change:**
- `ServerOptions` gains optional `fixedExec?: string`. When set, the server ignores `?exec=` from the URL and uses `fixedExec` for every connection. Useful for the one-shot `npx argus-bridge --cmd "node my-server.js"` flow described in the platform brief.
- CLI gains `--cmd <string>` mapped to `fixedExec`.

**Tests:** `argus-bridge/tests/server.test.ts`
- Add: with `fixedExec: 'cat'`, a connection with no `?exec=` parameter still works.
- Add: with `fixedExec` set, a `?exec=` in the URL is ignored.

---

### Task 2: Bridge `--version` flag

**File modified:** `argus-bridge/src/cli.ts`

**Change:** commander `.version(packageJson.version)` so `argus-bridge --version` prints. Reads version with a JSON import (or `JSON.parse(readFileSync)`).

**Tests:** smoke check via `tests/cli.test.ts` (new) — spawn `node dist/cli.js --version`, assert exit 0 + stdout has a semver-shaped string. Skipped if `dist/` not built. Actually we can shell out `tsx src/cli.ts --version` instead to avoid the dist dependency.

---

### Task 3: Build verification + shebang preservation

**Files modified:**
- `argus-bridge/tsconfig.json` — ensure `outDir: "./dist"`, `module: "ESNext"`, `target: "ES2022"`, `moduleResolution: "Bundler"`, no shebang stripping.
- `argus-bridge/package.json` — add `prepublishOnly: "pnpm build"` and a `chmod +x dist/cli.js` step if shebang isn't preserved.

**Verification:** `pnpm build && ls dist/cli.js && head -1 dist/cli.js` shows `#!/usr/bin/env node` and `chmod +x dist/cli.js` runs.

**Tests:** none (pure build hygiene).

---

### Task 4: Tiny in-tree stdio echo server for tests

**File created:** `argus-bridge/scripts/echo-server.mjs`

**Behavior:**
- Reads JSON-RPC frames from stdin (line-delimited).
- For each `initialize` request, responds with `{ protocolVersion, capabilities: {}, serverInfo: { name: 'echo', version: '0.0.0' } }`.
- For each other method, echoes back `{ jsonrpc: '2.0', id, result: { method, params } }`.
- Used only in tests; not shipped.

**Tests:** covered indirectly by Task 5.

---

### Task 5: E2E happy-path test

**File created:** `argus-bridge/tests/e2e.test.ts`

**Behavior:**
- Start `createBridgeServer({ allowShell: false })` on an ephemeral port.
- Open a WS to `/bridge?exec=node%20scripts%2Fecho-server.mjs&protocol=DRAFT-2026-v1`.
- Send a real `initialize` request, await response, assert shape.
- Send a `notifications/initialized`.
- Send a `ping` and await echo.
- Close WS, assert child process is reaped (no leaks).

This exercises spawn + framing + bidirectional pipe through a real subprocess.

---

### Task 6: Bridge probe helper in argus

**File modified:** `argus/lib/conformance/transport/bridge.ts`

**Change:** export

```ts
export function probeBridge(bridgeUrl: string, opts?: { timeoutMs?: number }): Promise<'ok' | string>
```

It opens a WS to `${bridgeUrl}?exec=&protocol=probe` and waits for either:
- a close with code 4001 ("missing exec query parameter") → returns `'ok'` (bridge is up and rejecting cleanly).
- any other close code → returns the close reason.
- open with no close within timeout → returns `'ok'`.
- error → returns the error message.

Timeout default 1500ms.

**Tests:** `argus/tests/unit/conformance/bridge-probe.test.ts`
- Mock WebSocket via `__setWebSocketCtor`. Cases:
  - Close 4001 immediately → resolves to `'ok'`.
  - Close 1006 → resolves to error string.
  - Error event → resolves to error string.
  - No event within timeout → resolves to `'ok'`.

---

### Task 7: ScanComposer hint + readiness check

**File modified:**
- `argus/components/test/ScanComposer.tsx`
- `argus/components/test/ScanComposer.module.css`

**Change:**
- When `transport === 'stdio-ws'`, show a `<div className={styles.hint}>` above the bridge fields:
  - Quoted command box: `npx argus-bridge --port 7879 --cmd "<your stdio command>"`.
  - A "Check bridge" button. Click → `probeBridge(bridgeUrl)` → render result inline: green dot + "bridge reachable" or red dot + the error string.
- The hint persists; not behind an info icon. Keeps cognitive load low for the failure case (which is the common one).

**Tests:** `argus/tests/unit/test/ScanComposer.test.tsx`
- Existing tests untouched.
- Add: selecting stdio shows the hint command text.
- Add: clicking Check bridge with a mocked probe returning `'ok'` shows the reachable message.

---

### Task 8: README + package.json polish

**Files modified:**
- `argus-bridge/README.md` — usage examples (both `--cmd` and `?exec=` modes), security notes (loopback-only by default; metachar denylist; `--allow-shell` escape hatch), example MCP commands, troubleshooting.
- `argus-bridge/package.json` — add `keywords: ["mcp", "model-context-protocol", "bridge", "stdio", "websocket", "argus"]`, `repository`, `homepage`, `bugs`, fix `engines`, ensure `files: ["dist", "README.md", "LICENSE"]`.

**Tests:** none.

---

### Task 9: Full-suite re-run + cross-package sanity

**Verification:**
- `argus-bridge: pnpm test` → all tests pass (12+).
- `argus: pnpm test` → 491+/491+ pass (no regressions in ScanComposer test).
- `argus-bridge: pnpm build` → dist artefact emitted, shebang preserved, `chmod +x` applied.
- `argus: pnpm build` → static export still clean.

## 6. Done criteria

- `npx argus-bridge --cmd "node my-server.js" --port 7879` starts and accepts WS connections.
- Stdio scan from `/test` page works end-to-end with the hint visible.
- "Check bridge" reports reachable / not reachable accurately.
- All tests green.
- `argus-bridge` package is structurally publishable (we don't actually publish in this phase).
