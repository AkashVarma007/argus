# argus-bridge

WebSocket ↔ stdio bridge that lets the [Argus](https://github.com/AkashVarma007/argus) browser app run MCP conformance scans against stdio-only servers (Claude Desktop plugins, local Python/Node servers, etc.).

## Install

```bash
npm i -g argus-bridge
# or one-shot:
npx argus-bridge
```

Requires Node 20+.

## Usage

### Browser-driven mode (default)

The bridge accepts a server command from the browser via `?exec=`:

```bash
argus-bridge                       # ws://127.0.0.1:7879/bridge
argus-bridge --port 8000           # custom port
argus-bridge --host 0.0.0.0        # bind to all interfaces (use sparingly)
argus-bridge --allow-shell         # permit shell metacharacters in exec
```

In Argus → Test → Transport → "stdio (via bridge)", paste your bridge URL and the server command (e.g. `python my_server.py`).

### One-shot mode (`--cmd`)

Pin a fixed command and ignore `?exec=` from the client. Useful for CI or running a single server in a sandbox:

```bash
argus-bridge --cmd "node /path/to/server.js"
argus-bridge --cmd "python -m my_mcp_server" --port 9000
```

When `--cmd` is set, the bridge spawns this exact argv on every WebSocket connection.

## Flags

| Flag                 | Default                | Notes |
|----------------------|------------------------|-------|
| `-p, --port <port>`  | `7879`                 | Listen port. |
| `-h, --host <host>`  | `127.0.0.1`            | Bind address. Loopback by default. |
| `--cmd <command>`    | (unset)                | Fixed server argv; overrides `?exec=`. |
| `--allow-shell`      | `false`                | Permit `;|&\`$<>` etc. in exec strings. |
| `--version`          | —                      | Print package version and exit. |

## Protocol

The browser opens `ws://<host>:<port>/bridge?exec=<urlencoded argv>&protocol=<spec>`. The bridge:

1. Parses `exec` argv-style (`"quoted args"` supported; shell metachars rejected unless `--allow-shell`).
2. Spawns the subprocess with stdio piped.
3. Sends each WS text frame to the child's stdin as a single LF-terminated line.
4. Sends each line of the child's stdout back as a WS text frame.
5. Closes the WS when either side disconnects.

### Close codes

| Code  | Meaning |
|-------|---------|
| 4001  | `exec` missing or empty (used by the Argus readiness probe). |
| 4002  | `exec` failed parse (shell metachars without `--allow-shell`, unterminated quotes, etc.). |
| 4003  | Child process exited before/while the WebSocket was open. |
| 1011  | Internal error spawning the child. |

## Security

- Bound to `127.0.0.1` by default. Use `--host 0.0.0.0` only on a trusted network.
- `exec` strings are parsed argv-style; shell metacharacters are rejected unless `--allow-shell` is passed.
- The child's stderr is **not** sent to the browser; it is logged on the bridge stderr for the operator to inspect.
- `--cmd` mode disables client-supplied commands entirely; safest for shared deployments.

## Development

```bash
pnpm install
pnpm dev          # runs src/cli.ts via tsx
pnpm test         # vitest (server, spawn, cli, e2e)
pnpm build        # tsc -> dist/, chmod +x dist/cli.js
```

The `e2e` test spawns a real Node echo server through a real bridge over a real WebSocket — see `tests/e2e.test.ts`.

## License

MIT
