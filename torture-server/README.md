# torture-server

A deliberately-broken MCP server. Every check in Argus that has a corresponding "bad" behavior here is expected to fire against this server.

This server is not published. It exists only as a fixture in this repo.

## Switches

Boot-time flags toggle individual violations on/off so individual checks can be unit-tested against just the behavior they target.

```bash
pnpm dev -- --bad T-07 J-04 R-04
```

The unit tests in `argus/tests/unit/conformance/checks/` boot a per-test instance with only the relevant switches enabled.
