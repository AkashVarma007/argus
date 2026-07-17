# E2E (Playwright)

A single Chromium happy-path test that walks the full surface:

1. Lands on `/`.
2. Uses the `g t` shortcut to navigate to `/test`.
3. Composes a stdio scan against an in-tree stub MCP server.
4. Runs the scan through `argus-bridge`.
5. Asserts the grade reveal renders.

## Prerequisites

```bash
# 1. Install Playwright and a Chromium binary (one-time):
pnpm install                          # picks up @playwright/test
pnpm test:e2e:install                 # downloads Chromium

# 2. Build argus-bridge (the spec runner shells out to its CLI):
cd ../argus-bridge && pnpm install && pnpm build
```

## Run

```bash
cd argus
pnpm test:e2e
```

The test spawns `argus-bridge --cmd "node tests/e2e/fixtures/stub-mcp-server.mjs"` via `global-setup.ts`. The Next dev server starts via Playwright's `webServer` config. Both are torn down after the run.

## Ports

| Env var                     | Default | Purpose                |
|-----------------------------|---------|------------------------|
| `ARGUS_E2E_PORT`            | 3010    | Next dev server port.  |
| `ARGUS_E2E_BRIDGE_PORT`     | 7889    | argus-bridge port.     |

## Notes

- The stub server only handles `initialize`, `ping`, `tools/list`, `resources/list`, `prompts/list`. Other RPCs return `-32601`. The scan will get a low grade — that's expected; the test only verifies the round-trip + grade reveal.
- Not wired to CI yet; this is a local-only sanity check for Phase 6.
