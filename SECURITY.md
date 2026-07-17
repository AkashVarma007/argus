# Security Policy

## Supported versions

| Version | Supported |
|---------|-----------|
| 0.1.x   | ✅        |

## Reporting a vulnerability

**Please do not open a public issue for security reports.**

Email **g.akashvarma@gmail.com** with a description of the issue and, if possible, steps to reproduce. You can expect an acknowledgement within a few days and a fix or mitigation plan for confirmed issues.

## Security model

Argus itself is a **static browser app with no backend** — no server-side attack surface, and all state lives in the browser's `localStorage`. The security-relevant components are the two optional companion CLIs, which run on the user's own machine:

- **`argus-bridge`** spawns local processes to relay stdio MCP servers. It binds to `127.0.0.1` by default, parses the exec string argv-style, and **rejects shell metacharacters** unless `--allow-shell` is passed. The child's stderr is never forwarded to the browser. Do not expose it with `--host 0.0.0.0` on untrusted networks; prefer `--cmd` to pin a fixed command in shared or CI environments.
- **`argus-proxy`** forwards HTTP requests to enable cross-origin scans. It binds to `127.0.0.1` and **refuses private/link-local address ranges** unless `--allow-private` is passed.

When scanning third-party MCP servers, treat their responses as untrusted input.
