# argus-proxy

Local CORS proxy used by [Argus](https://argus.dev) to test arbitrary MCP servers from the browser without baking a hosted backend into the app.

## Usage

```bash
npx argus-proxy             # listens on http://127.0.0.1:7878
npx argus-proxy --port 9000 # custom port
npx argus-proxy --allow-private  # permit private-network targets (use only on trusted networks)
```

Then in Argus → Test → "Proxy URL" → paste `http://127.0.0.1:7878/proxy`.

## Protocol

POST `/proxy` with JSON body `{ url: string, init: { method, headers, body? } }`. The proxy forwards the request, then returns the response body with `Access-Control-Allow-Origin: *`.

## Security

- Bound to `127.0.0.1` only — never accessible from another machine without explicit reconfiguration.
- Refuses private/link-local IPv4 and IPv6 ranges unless `--allow-private` is passed.
- Reuses the original status code, content-type, and body. No additional headers from the proxy are forwarded.
