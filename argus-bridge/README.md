# argus-bridge

WebSocket-to-stdio bridge that lets [Argus](https://argus.dev) run conformance scans against MCP servers that only support the stdio transport (e.g., Claude Desktop plugins).

## Usage

```bash
npx argus-bridge                # listens on ws://127.0.0.1:7879/bridge
npx argus-bridge --port 8000    # custom port
npx argus-bridge --allow-shell  # permit `--exec` to invoke shell metacharacters (sparingly!)
```

In Argus → Test → Transport → "stdio (bridge)", paste the server command (e.g. `python my_server.py`).

## Protocol

Browser opens `ws://127.0.0.1:7879/bridge?exec=<urlencoded command>&protocol=<spec>`. The bridge spawns the subprocess with the given argv. Each WebSocket text message is written as a single line (LF-terminated) to the child's stdin. Each line on the child's stdout is sent back as a text message on the WebSocket. The connection closes when either side disconnects.

## Security

- Bound to `127.0.0.1` only.
- `--exec` is parsed argv-style; shell metacharacters are rejected unless `--allow-shell` is passed.
- The bridge does not expose its child's stderr to the browser; stderr is logged on the bridge process for the user to inspect.
