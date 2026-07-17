# Contributing to Argus

Thanks for your interest in Argus — a browser-native workbench for the Model Context Protocol. This repository is a small multi-package monorepo; each package installs and builds independently (there is no root workspace).

## Repository layout

| Package | What it is |
|---------|------------|
| [`argus/`](argus/) | The app — a static Next.js 15 SPA (Test · Build · Learn). |
| [`argus-bridge/`](argus-bridge/) | WebSocket ↔ stdio relay for scanning stdio-only MCP servers. |
| [`argus-proxy/`](argus-proxy/) | Loopback CORS relay for scanning cross-origin HTTP servers. |
| [`torture-server/`](torture-server/) | A deliberately-broken MCP server used as the conformance test fixture. |
| [`docs/`](docs/) | Design brief, conformance catalog, platform spec, and build plans. |

## Prerequisites

- **Node.js 20+**
- **pnpm 9+** (`npm i -g pnpm`)

## Getting started

```bash
cd argus
pnpm install
pnpm dev            # http://localhost:3000
```

Each package is self-contained — `cd` into it, `pnpm install`, and use its own scripts.

## Running the checks

Before opening a pull request, make sure the same checks CI runs pass locally:

```bash
# in argus/
pnpm typecheck
pnpm test           # Vitest — unit + in-process e2e smoke
pnpm build          # static export (prebuild vendors the spec)

# in argus-bridge/ and argus-proxy/
pnpm build
pnpm test
```

## Project conventions

- **TypeScript, strict, ESM everywhere.** No CommonJS.
- **App styling:** CSS Modules + the token system in `argus/lib/tokens.ts`. No Tailwind, no hard-coded design values — reach for a token.
- **Conformance checks** are typed modules (see below), never ad-hoc assertions.
- **Commit messages** follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- Match the conventions of the surrounding code. Adapt to the codebase; don't refactor to a personal style.

## Adding a conformance check

Checks live under `argus/lib/conformance/checks/<category>/<ID>.<slug>/check.ts` and export a typed `Check`:

1. Create the module and export a `Check` (`id`, `category`, `severity`, `confidence`, `appliesTo`, `specRef`, `requires?`, `run(ctx)`).
2. Register it in `argus/lib/conformance/registry.ts`.
3. Attach `evidence` (request/response/expected/actual) so failures are actionable.
4. Add a test in `argus/tests/unit/conformance/checks/<category>.test.ts` that exercises it against `torture-server`.

Severity (`error` / `warning` / `info`) drives the grade — see `argus/lib/conformance/grading.ts`.

## Pull requests

1. Branch off `main`.
2. Keep the PR focused — every changed line should trace to the stated goal.
3. Add or update tests. `typecheck`, `test`, and `build` must be green.
4. Fill out the pull-request template.

## Reporting bugs / requesting features

Use the issue templates under **New issue**. For security reports, follow [`SECURITY.md`](SECURITY.md) instead of opening a public issue.

## License

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
