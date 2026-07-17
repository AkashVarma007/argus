# Changelog

All notable changes to `argus-bridge` will be documented in this file.

## [0.1.0] - 2026-05-29

Initial release. WebSocket↔stdio bridge for testing stdio-only MCP servers from the [Argus](https://github.com/AkashVarma007/argus) browser app.

### Added

- `argus-bridge` CLI with commander-driven flags:
  - `--port <port>` (default `7879`)
  - `--host <host>` (default `127.0.0.1`)
  - `--cmd <command>` — pin a fixed exec command, ignoring client-supplied `?exec=`
  - `--allow-shell` — permit shell metacharacters in exec strings
  - `--version` — print the package version
- HTTP server with WebSocket upgrade on `/bridge`.
- `?exec=<urlencoded argv>&protocol=<spec>` URL contract.
- argv tokenizer with shell-metachar denylist and quoted-string support.
- Close codes: `4001` (missing exec, used by readiness probe), `4002` (parse failure), `4003` (child exited).
- Child stderr surfaced on bridge stderr; not forwarded to the browser.
- 15 tests passing (`server`, `spawn`, `cli`, end-to-end `initialize` → `ping`).
- README with install, usage, flags, protocol, security, development docs.
- npm-publish hygiene: keywords, repository, homepage, bugs, `prepublishOnly`, shebang preservation under `tsc` output.

### Security notes

- Loopback-only bind by default.
- Shell metacharacters rejected unless `--allow-shell` is passed.
- `--cmd` mode disables client-supplied commands entirely.
