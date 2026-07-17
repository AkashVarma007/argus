# mcp-conformance

> **Build, validate, and improve MCP servers.** Spec-grade scaffolding for new servers, live conformance testing for existing ones, and hand-authored remediation snippets for every failure.

**Spec versions:** MCP `2025-11-25` (stable) and `DRAFT-2026-v1` (user-selectable).

---

## Table of contents

1. [Why this exists](#why-this-exists)
2. [Business model](#business-model)
3. [The three modes](#the-three-modes)
4. [Architecture](#architecture)
5. [Tech stack](#tech-stack)
6. [The Check abstraction](#the-check-abstraction)
7. [Worked check example](#worked-check-example)
8. [Check catalog](#check-catalog) — ~243 checks across 19 categories
9. [The Remediation abstraction](#the-remediation-abstraction)
10. [Worked remediation example](#worked-remediation-example)
11. [Build mode](#build-mode)
12. [Starter template structure](#starter-template-structure)
13. [Report output mockups](#report-output-mockups)
14. [CORS proxy](#cors-proxy)
15. [UI direction](#ui-direction)
16. [Build phases](#build-phases)
17. [Deploy](#deploy)
18. [Launch plan](#launch-plan)
19. [Success metrics](#success-metrics)
20. [Out of scope (v1.0)](#out-of-scope-v10)
21. [Spec references](#spec-references)

---

## Why this exists

MCP is at the moment where the FHIR validator, W3C HTML validator, and OAuth conformance suite got built for their specs. Two real problems exist:

**For server authors:** Reading the MCP spec (~12 pages across transports, lifecycle, tools, resources, prompts, sampling, elicitation, authorization, security best practices) and shipping a fully-conformant server takes days. Most production servers have subtle violations — wrong error codes, missing Origin validation, token audience bugs, schema dialect mismatches. There's no objective way to know if your server is right.

**For client/host authors:** When integrating with third-party MCP servers, there's no way to know which ones are reliable. "Does this server actually implement what it claims?"

`mcp-conformance` solves both: it tells you exactly where a server diverges from the spec, what to do about it (hand-authored fix snippets in your language), and — if you're starting from scratch — generates a server skeleton that passes the validator on day one.

---

## Business model

**Free tier (permanent):**
- Unlimited web validate runs (public servers)
- CLI tool (open-source, MIT)
- GitHub Action (open-source)
- Starter templates

**Pro tier ($29/month per team):**
- Report history (90-day retention, grade trend graphs)
- Scheduled daily re-validation with email/Slack/webhook alerts on grade regression
- Private reports (sharing requires auth token)
- Team dashboard (multiple servers, multiple members)
- REST API (`POST /api/v1/check`) for programmatic access
- Priority queue for web runs
- Live-grade badge embed (`/badge/<token>.svg`)

**Enterprise ($299/month):**
- SSO (Okta, Google Workspace)
- 99.9% SLA on API
- Custom check catalogs (internal spec extensions, private checks)
- On-premise deployment
- Dedicated Slack channel support

**Natural upsell path:** a failing report card → "Get Pro to schedule weekly re-validation and alert your team when this regresses." Conversion happens at the moment of maximum pain.

**Consulting surface:** "Your server scored a C. We offer a one-day audit to bring it to A. [Book a call]" — direct link on every sub-B report. This does not need to scale to be valuable; 5 audits/month at $2k each = $10k MRR from a single report page placement.

---

## The three modes

| Mode | What it does | Web | CLI |
|---|---|---|---|
| **Validate** | Point at a running MCP server → graded conformance report with evidence | Paste URL form | `mcp-conformance check <url>` |
| **Build** | Configure a new server → download a starter that passes the validator out of the box | Wizard → zip | `mcp-conformance init <name>` |
| **Suggest** | For each failing check, show the hand-authored fix snippet in TS/Python/Go/Rust | Inline in failed check cards | `mcp-conformance fix <url>` |
| **Fix All** | Auto-apply all remediations to the current project directory | — | `mcp-conformance fix --apply <url> --lang ts` |
| **Watch** | Re-run validation on every change, terminal stays live | — | `mcp-conformance watch <url>` |

GitHub template repos (one per language) are also published so devs can `Use this template` directly from GitHub.

---

## Architecture

Monorepo with **pnpm workspaces** + **Turborepo**. Designed for maximum scalability — adding the 100th check is as cheap as adding the 10th.

### Scalability principles

1. **One folder per check.** Not one file per category. A single check is a self-contained directory.
2. **Convention over configuration.** Folder name = check ID. No central registry to update.
3. **Auto-discovery.** The runner scans the `packages/checks/` tree at build time. No manual import list.
4. **Data, not code.** Spec versions, severities, capability gates declared as data, interpreted by one engine.
5. **No cross-cutting changes for additions.** Adding the 100th check must not require editing the runner, the UI, the report, or any other check.
6. **Co-located concerns.** Check code, remediation, spec excerpt, fixtures, and tests for one check live in one folder.
7. **One source of truth per concern.** Spec text, fixture, check logic, remediation — each lives once, referenced by ID.
8. **Versioning is metadata, not branching.** Supporting a new spec version is adding `appliesTo` tags, not forking the codebase.
9. **Confidence is separate from severity.** Each check declares `confidence: 'high' | 'medium' | 'heuristic'` so a heuristic-error displays differently from a verified-error.
10. **Deletable cleanly.** Removing a check is `rm -rf` on its folder. No dangling references anywhere else.

### Repo layout

```
mcp-conformance/
├── packages/
│   ├── core/                              # Engine — touched rarely
│   │   ├── src/
│   │   │   ├── runner.ts                  # Auto-discovers and runs checks
│   │   │   ├── client.ts                  # MCP client (declares sampling/elicitation/roots caps)
│   │   │   ├── transport.ts               # HTTP transport, raw + MCP
│   │   │   ├── context.ts                 # CheckContext factory
│   │   │   ├── types.ts                   # Check, Remediation, Report, Confidence types
│   │   │   ├── grading.ts                 # Letter-grade calculation
│   │   │   ├── discovery.ts               # Auto-imports every check.ts under packages/checks/
│   │   │   ├── reporter/
│   │   │   │   ├── json.ts                # JSON report (CI-friendly)
│   │   │   │   ├── cli.ts                 # Pretty CLI output
│   │   │   │   └── html.ts                # Web report renderer
│   │   │   └── helpers/                   # Shared probe helpers reused by many checks
│   │   │       ├── jsonrpc.ts             # buildRequest, expectError, expectResult
│   │   │       ├── headers.ts             # header assertions
│   │   │       └── sse.ts                 # SSE probe helpers
│   │   └── package.json
│   ├── checks/                            # ← All the value lives here. One folder per check.
│   │   ├── transport/
│   │   │   ├── T-07.origin-validation/
│   │   │   │   ├── check.ts               # The check definition
│   │   │   │   ├── remediation.ts         # Hand-authored fixes (TS/Py/Go/Rust)
│   │   │   │   ├── spec.md                # Quoted spec text + URL + commentary
│   │   │   │   ├── fixtures/              # Known good/bad transcripts for THIS check
│   │   │   │   │   ├── passing.json
│   │   │   │   │   └── failing.json
│   │   │   │   └── check.test.ts          # Unit tests
│   │   │   └── T-08.session-id-format/
│   │   │       └── ...                    # Same structure
│   │   ├── jsonrpc/
│   │   ├── lifecycle/
│   │   ├── tools/
│   │   ├── resources/
│   │   ├── prompts/
│   │   ├── utilities/
│   │   ├── authorization/
│   │   ├── security/
│   │   ├── sampling/
│   │   ├── elicitation/
│   │   ├── tasks/
│   │   ├── hygiene/
│   │   ├── discovery/
│   │   ├── stateless/
│   │   ├── subscriptions/
│   │   ├── caching/
│   │   └── mrtr/
│   ├── cli/                               # @mcp-conformance/cli — Node entry
│   ├── web/                               # Next.js 14 App Router — Vercel-deployed
│   │   └── app/api/proxy/                 # Edge function for CORS
│   ├── action/                            # GitHub Action wrapper around cli
│   ├── torture-server/                    # Deliberately-broken server: CI runs validator against
│   │                                      # it and asserts every check fires correctly
│   └── templates/                         # Starter templates (post-MVP)
│       ├── ts/
│       ├── python/
│       ├── go/
│       └── rust/
├── github-templates/                      # Mirrored as separate repos (post-MVP)
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

### What scalability buys us

- **A check is a directory.** Onboarding a contributor: "go look at any directory under `packages/checks/transport/` to see how a check is structured." That's the whole explanation.
- **The runner auto-imports.** No central registry. Adding `T-99.new-thing/` just makes it appear.
- **Deleting a check is `rm -rf`.** No dangling references.
- **Spec drift is local.** When the MCP spec changes, only the affected check folders need edits — spec excerpt, probe, fixtures. No engine changes.
- **PR review is bounded.** A new check PR touches exactly one folder. Reviewers don't have to read the rest of the codebase.
- **Test fixtures travel with the check.** Recorded request/response transcripts in `fixtures/` let the check be tested without a live server.

`core` has zero DOM and zero Node-only deps. The same checks run in the browser (via Edge proxy), the CLI, and the GitHub Action.

`torture-server/` is a deliberately-broken MCP server that violates every check; CI runs the validator against it and asserts every check fires correctly. Catches silent-pass bugs where a check thinks it passed but didn't actually probe anything.

`templates/` is the canonical source for starter projects (post-MVP feature); CI pushes each template to its own public repo so it shows up in GitHub's template gallery.

---

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Language | TypeScript strict | Catches spec violations at compile time |
| Monorepo | pnpm + Turborepo | Workspace caching |
| Web | Next.js 14 App Router | Edge functions, streaming |
| Styling | Tailwind + shadcn/ui | Speed + the right aesthetic |
| JSON Schema | `ajv` (2020-12 + draft-07) | Spec uses both |
| Runtime types | `zod` | Validates server responses cleanly |
| HTTP | native `fetch` | No axios dep in core |
| SSE parsing | `eventsource-parser` | Tiny, zero deps |
| Zip generation | `jszip` | For scaffold downloads |
| CLI | `commander` + `ora` (spinners) + `kleur` (colors) | Standard |
| Templates | Static files + `mustache` placeholders | Simple, debuggable |
| Deploy | Vercel (web), npm (cli), GitHub Marketplace (action) | Free tier covers v1 |
| Domain | `mcpconformance.dev` | $12/yr Porkbun |

---

## The Check abstraction

Every check has the same shape — probe, criterion, fix reference. Each check lives in its own folder; the runner auto-discovers them.

```typescript
// packages/core/src/types.ts
export type SpecVersion = '2025-11-25' | 'DRAFT-2026-v1';

export type Category =
  | 'transport' | 'jsonrpc' | 'lifecycle' | 'capabilities'
  | 'tools' | 'resources' | 'prompts'
  | 'sampling' | 'elicitation'
  | 'utilities' | 'authorization' | 'security' | 'tasks' | 'hygiene'
  | 'discovery' | 'stateless' | 'subscriptions' | 'caching' | 'mrtr';

export type Severity = 'error' | 'warning' | 'info';

// Separate from severity: how confident we are the check is correct.
// 'high'      = deterministic, spec-cited, hard to false-positive
// 'medium'    = involves some heuristic but well-bounded
// 'heuristic' = best-effort signal, may false-positive — UI marks differently
export type Confidence = 'high' | 'medium' | 'heuristic';

export interface SpecRef {
  url: string;          // direct link to the spec section
  section: string;      // human-readable name, e.g. "§ Origin Validation"
  quote: string;        // the MUST/SHOULD/MAY sentence verbatim
}

export interface Check {
  id: string;                                              // e.g. 'T-07' — must match folder name
  category: Category;
  severity: Severity;
  confidence: Confidence;
  appliesTo: SpecVersion[];
  title: string;                                           // short label
  probe: string;                                           // what the check sends
  criterion: string;                                       // what proves conformance
  specRef: SpecRef;
  requires?: ('tools' | 'resources' | 'prompts' | 'logging'
            | 'completions' | 'tasks' | 'subscribe')[];   // skip if capability absent
  deterministic: boolean;                                  // false → runner retries 3× for consensus
  slow?: boolean;                                          // gated behind --slow flag in CLI
  run(ctx: CheckContext): Promise<CheckResult>;
}

export interface CheckContext {
  client: McpClient;
  rawHttp: RawHttpClient;                                  // bypasses MCP client for transport pokes
  spec: SpecVersion;
  serverInfo: InitializeResult;
  capabilities: ServerCapabilities;
  log: (msg: string) => void;
}

export type CheckStatus = 'pass' | 'fail' | 'skip' | 'error';

export interface CheckResult {
  checkId: string;
  status: CheckStatus;
  message?: string;
  durationMs: number;
  evidence?: Evidence;
}

export interface Evidence {
  request?: { method: string; url?: string; headers: Record<string,string>; body: unknown };
  response?: { status?: number; headers: Record<string,string>; body: unknown };
  expected?: unknown;
  actual?: unknown;
  curlCommand?: string;                                    // pre-rendered for "Copy as curl"
}
```

Adding a check = creating a new folder under `packages/checks/<category>/<ID>.<slug>/` with a `check.ts` that default-exports the `Check` object. The runner auto-discovers it on next build. No central registry, no edits to other files.

### The "adding a new check" workflow

```bash
# 1. Create the folder. Filename = check ID.
mkdir -p packages/checks/transport/T-99.my-new-check

# 2. Drop in the four canonical files.
touch packages/checks/transport/T-99.my-new-check/check.ts
touch packages/checks/transport/T-99.my-new-check/remediation.ts
touch packages/checks/transport/T-99.my-new-check/spec.md
touch packages/checks/transport/T-99.my-new-check/check.test.ts

# 3. Implement check.ts (default export). Done. Runner picks it up.
pnpm test  # validates against torture-server fixtures
```

Spec-version support is also additive: tag with `appliesTo: ['DRAFT-2026-v1']` and the check skips automatically when the user selects a different version.

---

## Worked check example

This is what one fully-implemented check looks like. **T-07: Origin header validation.**

```typescript
// packages/checks/transport/T-07.origin-validation/check.ts
import type { Check } from '@mcp-conformance/core';

const check: Check = {
  id: 'T-07',
  category: 'transport',
  severity: 'error',
  confidence: 'high',
  deterministic: true,
  appliesTo: ['2025-11-25', 'DRAFT-2026-v1'],
  title: 'Server validates Origin header (DNS rebinding protection)',
  probe: 'Send POST /mcp with Origin: https://evil.example.com',
  criterion: 'Server returns HTTP 403 Forbidden',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#security-warning',
    section: '§ Security Warning',
    quote: 'Servers MUST validate the Origin header on all incoming connections to prevent DNS rebinding attacks. If the Origin header is present and invalid, servers MUST respond with HTTP 403 Forbidden.',
  },
  async run(ctx) {
    const start = performance.now();
    const probe = await ctx.rawHttp.fetch({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'Origin': 'https://evil.example.com',
        'MCP-Protocol-Version': ctx.spec,
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'ping',
      }),
    });

    const durationMs = performance.now() - start;
    const evidence = {
      request: {
        method: 'POST',
        url: ctx.client.url,
        headers: { Origin: 'https://evil.example.com' /* ... */ },
        body: { jsonrpc: '2.0', id: 1, method: 'ping' },
      },
      response: {
        status: probe.status,
        headers: probe.headers,
        body: await probe.text(),
      },
      expected: 403,
      actual: probe.status,
      curlCommand: `curl -X POST '${ctx.client.url}' \\
  -H 'Content-Type: application/json' \\
  -H 'Accept: application/json, text/event-stream' \\
  -H 'Origin: https://evil.example.com' \\
  -H 'MCP-Protocol-Version: ${ctx.spec}' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"ping"}'`,
    };

    if (probe.status === 403) {
      return { checkId: 'T-07', status: 'pass', durationMs, evidence };
    }
    return {
      checkId: 'T-07',
      status: 'fail',
      message: `Expected 403 for bogus Origin, got ${probe.status}. ` +
               `Server is vulnerable to DNS rebinding attacks.`,
      durationMs,
      evidence,
    };
  },
};
```

Every check follows this shape: probe → measure → evidence → pass/fail with diagnostic message. The diagnostic message names the *security/interop consequence*, not just the symptom.

---

## Check catalog

**MVP scope is ~37 checks across 6 categories**, marked **★ MVP** below. The full ~243-check catalog across 19 categories is the documented roadmap. The architecture supports the full set from day one — what's gated is the *content*, not the engine.

The MVP checks were chosen by: high confidence (rare false positives), high severity (real interop or security impact), and high spec subtlety (most-commonly-violated). After MVP ships, additional checks land as PRs to `packages/checks/<category>/<ID>.<slug>/` — no engine changes needed.

Each check entry below shows **probe → criterion**. Severity, confidence, and spec refs are tracked in each check's `check.ts` file.

### MVP categories (ship in v1.0)

★ Transport · ★ JSON-RPC · ★ Lifecycle · ★ Capabilities · ★ Tools · ★ Authorization (subset)

### Roadmap categories (post-MVP)

Resources · Prompts · Sampling · Elicitation · Utilities · Security · Tasks · Hygiene · RC-specific · Discovery · Stateless · Subscriptions · Caching · MRTR

---

### Category 1: Transport (17 — ★ 6 in MVP)

`https://modelcontextprotocol.io/specification/2025-11-25/basic/transports`

| ID | Probe → Criterion | Sev |
|---|---|---|
| ★ T-01 | POST with `Content-Type: application/json` → accepts (200/202/SSE), not 415 | error |
| ★ T-03 | Inspect response `Content-Type` → is `application/json` or `text/event-stream` | error |
| T-02 | GET with `Accept: text/event-stream` → returns SSE stream OR 405 | error |
| T-04 | POST request expecting response, vary `Accept` → server respects content negotiation | error |
| T-05 | POST a JSON-RPC notification (no `id`) → 202 Accepted, empty body | error |
| T-06 | Send HTTP PUT/PATCH → 405 Method Not Allowed | error |
| ★ T-07 | POST with `Origin: https://evil.example.com` → 403 Forbidden | error |
| T-08 | Inspect `MCP-Session-Id` header (if assigned) → only visible ASCII (0x21–0x7E), high entropy | error |
| T-09 | Send non-initialize request without session ID (when required) → 400 Bad Request | error |
| T-10 | Send request with stale session ID → 404 Not Found | error |
| T-11 | DELETE with valid session ID → 200 (terminated) or 405 | warning |
| ★ T-12 | Inspect post-init requests → `MCP-Protocol-Version` header present | error |
| ★ T-13 | Send `MCP-Protocol-Version: 9999-99-99` → 400 Bad Request | error |
| T-14 | Open SSE, force disconnect, reconnect with `Last-Event-ID` → server replays missed events from same stream only | error |
| T-15 | Trigger server-initiated SSE close → `retry` field sent before close | warning |
| T-16 | Send a JSON-RPC batch array body (`[{...},{...}]`) → server returns `-32600` Invalid Request (batching not supported since 2025-06-18) | error |
| T-17 | SSE response includes `X-Accel-Buffering: no` header → present to prevent proxy buffering | warning |

### Category 2: JSON-RPC 2.0 (9 — ★ all 9 in MVP)

| ID | Probe → Criterion | Sev |
|---|---|---|
| ★ J-01 | Inspect any response → contains `"jsonrpc": "2.0"` | error |
| ★ J-02 | Send request with `id: "abc"` → response has `id: "abc"` (same string, not coerced) | error |
| ★ J-03 | Inspect responses → exactly one of `result` or `error`, never both | error |
| ★ J-04 | Call `method: "nonexistent/method"` → error code `-32601` | error |
| ★ J-05 | POST `{"jsonrpc":"2.0","id":1,"method":` (truncated) → error code `-32700` | error |
| ★ J-06 | Call `tools/call` with missing `name` param → error code `-32602` | error |
| ★ J-07 | Send notification (no `id` field) → no response body, just 202 | error |
| ★ J-08 | Inspect any error → `code` is integer, `message` is string; `data` optional | error |
| ★ J-09 | Trigger an internal server error (e.g., valid method with syntactically valid but semantically impossible params designed to cause a handler exception) → error code is `-32603` Internal Error, not an arbitrary or HTTP-level code | error |

### Category 3: Lifecycle (11 — ★ 7 in MVP)

`https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle`

| ID | Probe → Criterion | Sev |
|---|---|---|
| ★ L-01 | Send `initialize` → result has `protocolVersion`, `capabilities`, `serverInfo` | error |
| ★ L-02 | Inspect `serverInfo` → `name` and `version` are strings; `title`/`description`/`icons`/`websiteUrl` typed correctly if present | error |
| ★ L-03 | Inspect returned `protocolVersion` → server can actually serve that version | error |
| ★ L-04 | Send `initialize` with `protocolVersion: "2025-11-25"` → server echoes `"2025-11-25"` | error |
| ★ L-05 | Send `initialize` with `protocolVersion: "9999-99-99"` → server returns its latest supported version | error |
| ★ L-06 | Send `notifications/initialized` → subsequent requests work | error |
| L-07 | Send `tools/list` before `notifications/initialized` → request rejected or queued | warning |
| L-08 | Observe SSE before `initialized` → no requests sent except `ping`/`logging` | warning |
| ★ L-09 | Send `ping` pre-init and post-init → both succeed | error |
| L-10 | Client sends `notifications/cancelled` with `requestId` of the `initialize` request → server ignores (initialize MUST NOT be cancelled) | error |
| L-11 | Send a JSON-RPC batch array body (`[{...},{...}]`) → server returns `-32600` Invalid Request (batching removed in 2025-06-18) | error |

### Category 4: Capabilities honesty (6 — ★ all 6 in MVP)

| ID | Probe → Criterion | Sev |
|---|---|---|
| ★ C-01 | If `capabilities.tools` declared → `tools/list` returns valid response | error |
| ★ C-02 | If `capabilities.resources` declared → `resources/list` returns valid response | error |
| ★ C-03 | If `capabilities.prompts` declared → `prompts/list` returns valid response | error |
| ★ C-04 | If `capabilities.logging` declared → `logging/setLevel` returns success | error |
| ★ C-05 | If `capabilities.completions` declared → `completion/complete` returns valid response | error |
| ★ C-06 | If `capabilities.tools` NOT declared → `tools/list` returns `-32601` | error |

### Category 5: Tools (19 — ★ 6 in MVP)

`https://modelcontextprotocol.io/specification/2025-11-25/server/tools`

| ID | Probe → Criterion | Sev |
|---|---|---|
| ★ TL-01 | Inspect every tool → has `name`, `description`, `inputSchema` | error |
| ★ TL-02 | Validate each `inputSchema` with ajv → valid JSON Schema (dialect from `$schema`, default 2020-12) | error |
| TL-03 | Inspect parameterless tools → schema is `{"type":"object","additionalProperties":false}` or `{"type":"object"}` | warning |
| TL-04 | Inspect tool names → 1–128 chars, only `[A-Za-z0-9_.-]` | warning |
| ★ TL-05 | Inspect tools list → no duplicate names | error |
| TL-06 | If `title` present → is a string | error |
| TL-07 | Call `tools/list` with `cursor` from first response → returns next page or empty | error |
| ★ TL-08 | Call `tools/call` with `name: "definitely_not_a_tool"` → protocol error | error |
| ★ TL-09 | Call existing tool with schema-violating input → `result.isError: true` (NOT `-32602`) | error |
| TL-10 | If tool declares `outputSchema` → call it, validate `structuredContent` against schema | error |
| TL-11 | If `structuredContent` returned → JSON-serialized form also present in a TextContent block | warning |
| ★ TL-12 | Inspect tool result content → only valid types (`text`/`image`/`audio`/`resource_link`/`resource`) with required fields | error |
| TL-13 | Image/audio content → has base64 `data` and `mimeType` matching declared type | error |
| TL-14 | If `execution.taskSupport` present → value is `"forbidden"`, `"optional"`, or `"required"` | error |
| TL-15 | If `tools.listChanged` declared → after a tool changes, `notifications/tools/list_changed` observed | warning |
| TL-16 | Call `tools/list` on two separate connections with identical capabilities → result list is identical (MUST NOT vary per-connection; MAY vary by authorization only) | error |
| TL-17 | If any tool result item has `type: "resource_link"` → item has `uri` (string) and `name`; optional `mimeType` present if declared | error |
| TL-18 | If any tool result item has `type: "audio"` → item has `data` (base64-encoded) and `mimeType` starting with `audio/` | error |
| TL-19 | Call `tools/list` three times on same connection → order of tools array is identical each time (deterministic ordering) | warning |

### Category 6: Resources (15)

`https://modelcontextprotocol.io/specification/2025-11-25/server/resources`

| ID | Probe → Criterion | Sev |
|---|---|---|
| R-01 | Inspect resources → each has `uri` and `name`; optional fields typed correctly | error |
| R-02 | Validate each URI per RFC 3986 → parses successfully | error |
| R-03 | Call `resources/list` with `cursor` → pagination works | error |
| R-04 | Call `resources/read` → `contents` array with `uri` and either `text` or `blob` per item | error |
| R-05 | Read returned content → `mimeType` matches resource declaration | error |
| R-06 | Read `uri: "file:///definitely-not-here.txt"` → error code `-32002` or `-32602` | error |
| R-07 | Inspect each content item → exactly one of `text` or `blob`, never both | error |
| R-08 | If `resourceTemplates` returned → each `uriTemplate` is valid RFC 6570 | error |
| R-09 | Subscribe to a resource, change it on the server, observe → `notifications/resources/updated` received | error |
| R-10 | Unsubscribe → no further update notifications received | error |
| R-11 | If `resources.listChanged` declared → list-change notification observable | warning |
| R-12 | Inspect annotations → `audience` ⊆ `["user","assistant"]`, `priority` ∈ [0,1], `lastModified` ISO 8601 | warning |
| R-13 | If `resources` capability declared → call `resources/templates/list`; if templates exist, each has valid `uriTemplate` (RFC 6570) and `name` | error |
| R-14 | Call `resources/read` with non-existent URI → server returns error code `-32002` OR `-32602` (both acceptable per SEP-2164) | error |
| R-15 | Call `resources/read` with non-existent URI → server MUST NOT return a success result with an empty `contents` array (ambiguous response forbidden) | error |

### Category 7: Prompts (8)

`https://modelcontextprotocol.io/specification/2025-11-25/server/prompts`

| ID | Probe → Criterion | Sev |
|---|---|---|
| P-01 | Inspect prompts → each has `name`; optional fields typed correctly | error |
| P-02 | Inspect prompt `arguments` → each has `name`; optional `description`/`required` typed correctly | error |
| P-03 | Call `prompts/list` with `cursor` → pagination works | error |
| P-04 | Call `prompts/get` with valid args → `messages` array, each with valid `role` and `content` | error |
| P-05 | Inspect prompt message content → only valid types with required fields | error |
| P-06 | If embedded resource in message → has valid `uri`, `mimeType`, and `text` or `blob` | error |
| P-07 | Call `prompts/get` with bad name OR missing required arg → error code `-32602` | error |
| P-08 | If `prompts.listChanged` declared → list-change notification observable | warning |

### Category 8: Sampling (server-initiated) (10)

`https://modelcontextprotocol.io/specification/2025-11-25/client/sampling`

Validator declares `sampling: { tools: {} }` and triggers tools likely to invoke sampling. Skips if server never issues `sampling/createMessage`.

| ID | Probe → Criterion | Sev |
|---|---|---|
| SMP-01 | Inspect `sampling/createMessage` → `messages` array, each with valid `role` and `content` | error |
| SMP-02 | Inspect message content → only valid types (`text`/`image`/`audio`/`tool_use`/`tool_result`) with required fields | error |
| SMP-03 | Image/audio content → base64 `data` and valid `mimeType` | error |
| SMP-04 | If `modelPreferences` present → priorities ∈ [0,1] | error |
| SMP-05 | Validator does NOT declare `sampling.tools`; trigger sampling → server does NOT send tool-enabled requests | error |
| SMP-06 | If `toolChoice` present → `mode` ∈ `{"auto","required","none"}` | error |
| SMP-07 | Multi-turn flow → every assistant `tool_use` block followed by user message of only `tool_result` blocks, matched by `toolUseId` | error |
| SMP-08 | In multi-turn sampling, a user message that follows a `tool_use` block MUST contain ONLY `tool_result` content blocks — no mixed text + tool_result in the same user message | error |
| SMP-09 | If `toolChoice: { mode: "required" }` sent → `stopReason` in result MUST be `"toolUse"` | error |
| SMP-10 | Validator does NOT declare `sampling.context`; trigger sampling → server MUST NOT use `includeContext: "thisServer"` or `"allServers"` (soft-deprecated values gated by capability) | warning |

### Category 9: Elicitation (server-initiated) (15)

`https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation`

Validator declares `elicitation: { form: {}, url: {} }`. Always replies with `action: "cancel"` to avoid side effects.

| ID | Probe → Criterion | Sev |
|---|---|---|
| EL-01 | Inspect `elicitation/create` → `message` is a non-empty string | error |
| EL-02 | Inspect `mode` → `"form"`, `"url"`, or omitted (form default) | error |
| EL-03 | Form mode → `requestedSchema` is valid JSON Schema, restricted to flat primitives | error |
| EL-04 | Form mode → no nested objects, no arrays of objects (except enums) | error |
| EL-05 | Form mode → schema field names don't suggest sensitive data (regex on `password`/`apikey`/`token`/`secret`/`cvv`/etc.) | error |
| EL-06 | URL mode → includes `url`, `elicitationId`, `message` | error |
| EL-07 | URL mode → URL uses HTTPS | warning |
| EL-08 | URL mode → URL query string contains no credentials/PII (heuristic) | error |
| EL-09 | `notifications/elicitation/complete` references a known `elicitationId` | error |
| EL-10 | `URLElicitationRequiredError` → code is `-32042`, `data.elicitations` array of URL-mode entries | error |
| EL-11 | Form schema with `default` values on primitive fields → validator sends those defaults; server accepts the response without error | warning |
| EL-12 | Form schema uses `oneOf: [{const, title}, ...]` shape (titled single-select enum) → validator accepts and returns one of the `const` values | error |
| EL-13 | Form schema uses `type: "array"` with `items: {enum: [...]}` (multi-select enum) → validator sends an array of selected values; server accepts | error |
| EL-14 | URL mode with `action: "accept"` in response means user consented to open the URL, NOT that the interaction completed — server MUST NOT assume form data was submitted | error |
| EL-15 | Form-mode elicitation completes (validator sends `action: "accept"`) → server MUST NOT subsequently send `notifications/elicitation/complete` for that `elicitationId` (that notification is URL-mode only) | error |

### Category 10: Utilities (18)

Covers Ping, Cancellation, Progress, Pagination, Logging, Completion, SSE resumption.

| ID | Probe → Criterion | Sev |
|---|---|---|
| U-01 | Send `ping` → returns empty result `{}` (not an error) within 5s | error |
| U-02 | Send long-running tool with `_meta.progressToken: "abc123"`, then `notifications/cancelled` with matching `requestId` → no late response arrives | error |
| U-03 | Send `notifications/cancelled` for unknown `requestId` → no response, no error (silently ignored) | error |
| U-04 | Send request with `params._meta.progressToken: "abc123"` → `notifications/progress` carries same token in `params.progressToken` | error |
| U-05 | Observe progress sequence → `progress` value strictly increases each notification | error |
| U-06 | Inspect `notifications/progress` → `progress` and optional `total` are numbers (int or float); optional `message` is string | error |
| U-07 | After request completes → no further `notifications/progress` for that token | error |
| U-08 | Call every `*/list` with `cursor` → accepted (no `-32602`) | error |
| U-09 | Force a paginated list → `nextCursor` returned when more pages exist; absent on final page | error |
| U-10 | Treat `cursor` as opaque → server doesn't reject lexically-modified-but-server-issued cursors with structural assumptions on client side | info |
| U-11 | Call `logging/setLevel` with each RFC 5424 level (`debug`/`info`/`notice`/`warning`/`error`/`critical`/`alert`/`emergency`) → all accepted | error |
| U-12 | Call `logging/setLevel` with `"invalid"` → `-32602` | error |
| U-13 | Set level to `error`, trigger `info` log → no `notifications/message` received | warning |
| U-14 | Call `completion/complete` → valid structure if `completions` declared | error |
| U-15 | SSE resumption with `Last-Event-ID` → replays from cursor; event IDs globally unique within session | error |
| U-16 | Call `completion/complete` with `context.arguments` populated (previously-resolved args) → server returns valid completion list without erroring on the context field | error |
| U-17 | Send request with `params._meta.progressToken` as an integer (not a string) → server sends `notifications/progress` with matching integer token | error |
| U-18 | Call `completion/complete` with `ref.type: "ref/resource"` → server returns valid completion response (resource ref type supported, not just prompt ref) | error |

### Category 11: Authorization (22 — ★ 4 in MVP, deterministic high-confidence subset only)

`https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization`

| ID | Probe → Criterion | Sev |
|---|---|---|
| ★ AUTH-01 | Request without `Authorization` → 401 with `WWW-Authenticate: Bearer` header | error |
| ★ AUTH-02 | `WWW-Authenticate` → includes `resource_metadata="..."` URL | error |
| ★ AUTH-03 | GET `.well-known/oauth-protected-resource` → valid RFC 9728 JSON | error |
| AUTH-04 | Inspect resource metadata → non-empty `authorization_servers` array | error |
| AUTH-05 | GET `.well-known/oauth-authorization-server` AND `.well-known/openid-configuration` → both work | error |
| AUTH-06 | Inspect AS metadata → `code_challenge_methods_supported` contains `"S256"` | error |
| AUTH-07 | Send token with wrong `aud` claim → 401 (audience binding enforced) | error |
| AUTH-08 | Authenticated request lacking required scope → 403 with `error="insufficient_scope"` and `scope="..."` | error |
| AUTH-09 | Send token issued for a different MCP server → rejected | error |
| ★ AUTH-10 | Send `?access_token=xxx` in URL → rejected | error |
| AUTH-11 | Inspect all auth endpoints → HTTPS | error |
| AUTH-12 | If supporting CIMD → AS metadata has `client_id_metadata_document_supported: true` | warning |
| AUTH-13 | If DCR supported → `registration_endpoint` exposed | warning |
| AUTH-14 | Heuristic: tool calls don't propagate client `Authorization` header to upstream (timing/header analysis) | error |
| AUTH-15 | Malformed authorization request → 400 | error |
| AUTH-16 | OAuth state parameter present and validated through full flow | error |
| AUTH-17 | Inspect AS metadata → `code_challenge_methods_supported` MUST contain `"S256"`; `"plain"` MUST NOT be the only listed method | error |
| AUTH-18 | Authorization request to AS → includes `resource` parameter matching MCP server's resource URI (RFC 8707) | error |
| AUTH-19 | Token request to AS → includes `resource` parameter matching MCP server's resource URI (RFC 8707) | error |
| AUTH-20 | Authorization response includes `iss` parameter → client validates it matches expected AS issuer (RFC 9207 mix-up protection) | error |
| AUTH-21 | DCR registration request includes `application_type` field → server accepts without rejecting valid OIDC registration fields | warning |
| AUTH-22 | Step-up auth: if server challenges with `insufficient_scope`, client re-authenticates requesting accumulated union of all previously challenged scopes | error |

### Category 12: Security (14)

`https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices`

| ID | Probe → Criterion | Sev |
|---|---|---|
| S-01 | Search server-issued URLs/headers → session ID never in query string | error |
| S-02 | Reuse session ID across auth contexts → rejected | error |
| S-03 | Inspect OAuth consent flow → state cookie set AFTER consent screen, not before | error |
| S-04 | Force an error → response body contains no stack trace, file path, or internal hostname | error |
| S-05 | Rapid tool calls → rate limiting kicks in (429 or similar) | warning |
| S-06 | Covered by T-07 (cross-reference) — Origin validation | error |
| S-07 | If local server metadata exposes bind address → is `127.0.0.1` not `0.0.0.0` | warning |
| S-08 | Send input with HTML/script chars → no unsanitized echo in error messages | error |
| S-09 | Elicitation/sampling state bound to user identity, not session ID alone (heuristic) | error |
| S-10 | URL-mode elicitation URLs → no pre-authentication tokens embedded | error |
| S-11 | Inspect all icon `src` values in server/tool/resource metadata → MUST be `https://` or `data:` URI; `http://`, `javascript:`, and `file:` schemes are rejected | error |
| S-12 | Tool calls MUST NOT forward the client's incoming `Authorization: Bearer` token to any upstream HTTP call (token passthrough prohibition) — heuristic via timing/header analysis | error |
| S-13 | Icon URLs MUST be same-origin as the MCP server OR use `data:` URI — cross-origin icon fetches are disallowed per spec security requirements | warning |
| S-14 | If `requestState` present in `InputRequiredResult` (MRTR): retry with bitflipped `requestState` → server MUST reject tampered state (integrity protection enforcement) | error |

### Category 13: Tasks (17, experimental — only if `tasks` capability declared)

`https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks`

Capability schema is structured: `capabilities.tasks.list`, `capabilities.tasks.cancel`, `capabilities.tasks.requests.tools.call`. Methods are `tasks/get`, `tasks/result`, `tasks/list`, `tasks/cancel`. Task statuses: `working` (initial), `input_required`, `completed`, `failed`, `cancelled`.

| ID | Probe → Criterion | Sev |
|---|---|---|
| TK-01 | If `tasks.requests.tools.call` declared → call a tool with `task: { ttl: 60000 }` in params → returns `CreateTaskResult` containing `task.taskId`, `task.status: "working"`, `task.createdAt`, `task.lastUpdatedAt` | error |
| TK-02 | Inspect `taskId` → string, unique (UUID-shaped or equivalent entropy) | error |
| TK-03 | Inspect timestamps → `createdAt` and `lastUpdatedAt` are valid ISO 8601 (RFC 3339) | error |
| TK-04 | Call `tasks/get` → returns full `Task` object; `pollInterval` (if present) is a positive number in ms | error |
| TK-05 | Call `tasks/get` with bogus `taskId` → `-32602` Invalid params | error |
| TK-06 | Call `tasks/result` while task is `working` → blocks until terminal status | error |
| TK-07 | Call `tasks/result` for completed task → returns the underlying request's result shape (e.g., `CallToolResult` for `tools/call`); response includes `_meta["io.modelcontextprotocol/related-task"].taskId` | error |
| TK-08 | If `tasks.list` capability declared → `tasks/list` returns array of `Task` objects; supports `cursor` pagination | error |
| TK-09 | If `tasks.cancel` capability declared → `tasks/cancel` on `working` task → returns task with `status: "cancelled"` BEFORE response sent | error |
| TK-10 | Call `tasks/cancel` on already-terminal task → `-32602` Invalid params with message about terminal status | error |
| TK-11 | Observe status transitions → only valid paths: `working` → `{input_required, completed, failed, cancelled}`; `input_required` → `{working, completed, failed, cancelled}`; terminal states never transition | error |
| TK-12 | If server declares `tasks.requests.tools.call` and tool has `execution.taskSupport: "required"` → non-task-augmented `tools/call` returns `-32601` | error |
| TK-13 | If tool has `execution.taskSupport: "forbidden"` or absent → task-augmented `tools/call` returns `-32601` | error |
| TK-14 | If `notifications/tasks/status` sent → includes full `Task` object with updated `status`; does NOT include `io.modelcontextprotocol/related-task` in `_meta` (taskId is in params) | warning |
| TK-15 | Tool-result-isError tasks → task transitions to `failed` status (not `completed`); `tasks/result` returns the same error shape the underlying call would have returned | error |
| TK-16 | Task expiry: after `ttl` elapses, `tasks/get` on that task → either continues to work OR returns `-32602` with "expired"/"not found" message (both compliant) | warning |
| TK-17 | Validator sends `notifications/cancelled` for an in-flight task-augmented request → server MUST ignore (tasks have their own cancellation via `tasks/cancel`) | error |

### Category 14: Hygiene (14, mostly warnings)

| ID | Probe → Criterion | Sev |
|---|---|---|
| H-01 | Inspect error messages → contain helpful text, not just numeric code | warning |
| H-02 | Time every `*/list` call → <5s response | warning |
| H-03 | Inspect declared primitives → at least one tool, resource, or prompt | info |
| H-04 | If `description` field present on `Implementation` → non-empty string | info |
| H-05 | Inspect server response headers or info → spec version(s) supported is clear | warning |
| H-06 | HEAD every declared icon URL → 200 | warning |
| H-07 | Inspect descriptions → non-empty | warning |
| H-08 | Inspect every JSON payload → valid UTF-8 | error |
| H-09 | Inspect JSON-RPC payloads → no embedded raw newlines in string fields | warning |
| H-10 | Time 20 sequential `tools/list` calls → no degradation pattern | info |
| H-11 | All icon URLs in server/tool/resource metadata → MUST be `https://` or `data:` only (no `http://` icon fetches) | warning |
| H-12 | Icon URLs fetched with no credentials, no `Authorization` header, no cookies — server MUST NOT require authentication to fetch its own icons | warning |
| H-13 | `_meta` keys in server responses MUST use valid two-segment format; keys using reserved prefixes (`io.modelcontextprotocol/`, `dev.mcp/`) MUST be spec-defined, not custom | warning |
| H-14 | Fetch each declared icon URL → leading bytes (magic bytes) match declared `mimeType`; MIME-type mismatch indicates spoofed content type | warning |

### RC-specific (14) — `appliesTo: ['DRAFT-2026-v1']`

| ID | Probe → Criterion | Sev |
|---|---|---|
| RC-01 | Inspect requests → `Mcp-Method` header matches JSON-RPC method | error |
| RC-02 | Inspect requests → `Mcp-Name` header present | error |
| RC-03 | Strip `Mcp-Method`/`Mcp-Name` from request → 400 | error |
| RC-04 | Stateless mode: send requests across simulated horizontal-scaled nodes → all succeed | warning |
| RC-05 | Send HTTP GET to the MCP endpoint (old SSE stream endpoint) → server returns `405 Method Not Allowed` (GET stream endpoint removed in `DRAFT-2026-v1`) | error |
| RC-06 | Inspect server response headers → server MUST NOT return `Mcp-Session-Id` header (session concept removed) | error |
| RC-07 | Send POST where `Mcp-Method` header value does not match the JSON-RPC `method` field → server returns `-32001` HeaderMismatch error | error |
| RC-08 | Send `initialize` method → server returns `-32601` Method Not Found (initialize removed in `DRAFT-2026-v1`) | error |
| RC-09 | Send `ping` method → server returns `-32601` Method Not Found (ping removed in `DRAFT-2026-v1`) | error |
| RC-10 | Send `logging/setLevel` method → server returns `-32601` Method Not Found (per-connection log level removed) | error |
| RC-11 | Send `notifications/initialized` notification → server silently ignores it (no error, no response) | warning |
| RC-12 | Send POST with `Mcp-Method: tools/list` header but body containing `method: "tools/call"` (deliberate mismatch) → server returns `-32001` HeaderMismatch | error |
| RC-13 | Send `tools/call` request with NO `_meta.io.modelcontextprotocol/logLevel` field → server MUST NOT emit any `notifications/message` (per-request log level absent = no logs) | error |
| RC-14 | Inspect successful (non-MRTR) result responses → MUST contain `resultType: "complete"` field; absent field is only backward-compat mode, not conformant | error |

### Category 15: Discovery (6) — `appliesTo: ['DRAFT-2026-v1']`

`https://modelcontextprotocol.io/specification/DRAFT-2026-v1/basic/discovery`

| ID | Probe → Criterion | Sev |
|---|---|---|
| DISC-01 | POST `server/discover` → result has `supportedVersions[]`, `capabilities`, and `serverInfo` fields | error |
| DISC-02 | Inspect `supportedVersions` → non-empty array; each entry is a valid version string | error |
| DISC-03 | Send `server/discover` over STDIO transport → `-32601` Method Not Found signals legacy server (used for backward-compat probe) | warning |
| DISC-04 | If `instructions` field present in discover result → is a non-empty string | error |
| DISC-05 | Cross-check: `capabilities` in `server/discover` response matches what server actually serves (e.g., declares `tools` → `tools/list` works; declares nothing → `tools/list` returns `-32601`) | error |
| DISC-06 | Send request with OpenTelemetry trace context (`_meta.traceparent` set to valid W3C trace ID) → server does not error on unrecognized OTel keys; forwards or ignores them cleanly | info |

### Category 16: Stateless Protocol (8) — `appliesTo: ['DRAFT-2026-v1']`

`https://modelcontextprotocol.io/specification/DRAFT-2026-v1/basic/lifecycle`

| ID | Probe → Criterion | Sev |
|---|---|---|
| SL-01 | Send `tools/list` with `_meta.io.modelcontextprotocol/protocolVersion` (no `initialize` handshake first) → server returns valid response | error |
| SL-02 | Send `initialize` method in stateless mode → server returns `-32601` Method Not Found | error |
| SL-03 | Send request with `_meta.io.modelcontextprotocol/protocolVersion: "9999-99-99"` → server returns `UnsupportedProtocolVersionError` (`-32004`) with `data.supported[]` (non-empty array of valid version strings) AND `data.requested` (the version string that was rejected) | error |
| SL-04 | Send request missing `_meta.io.modelcontextprotocol/protocolVersion` → server returns `MissingRequiredClientCapabilityError` (`-32003`) or HTTP 400; if -32003, `data.requiredCapabilities` is a valid `ClientCapabilities` object | error |
| SL-05 | Send request missing `_meta.io.modelcontextprotocol/clientInfo` → server returns `-32003` or HTTP 400; if -32003, `data.requiredCapabilities` present (all three `_meta` required fields enforced) | error |
| SL-06 | Send request missing `_meta.io.modelcontextprotocol/clientCapabilities` → server returns `-32003` or HTTP 400; if -32003, `data.requiredCapabilities` present | error |
| SL-07 | Call `tools/list` on two separate stateless requests with no session context → results are identical (no per-connection state leakage) | error |
| SL-08 | If server returns `extensions` in discover capabilities → declare matching extension support in client `_meta.clientCapabilities.extensions`; verify server serves extension behavior; omit extension → verify server falls back to core behavior without error | warning |

### Category 17: Subscriptions (5) — `appliesTo: ['DRAFT-2026-v1']`

`https://modelcontextprotocol.io/specification/DRAFT-2026-v1/basic/subscriptions`

Skips if server does not expose `subscriptions/listen`.

| ID | Probe → Criterion | Sev |
|---|---|---|
| SUB-01 | POST `subscriptions/listen` with `{ toolsListChanged: true }` → response is `text/event-stream` SSE stream | error |
| SUB-02 | First SSE event on subscription stream → is `notifications/subscriptions/acknowledged` containing `acknowledged` subset | error |
| SUB-03 | Inspect `acknowledged` subset → MUST be a subset of the requested filter types (no extra types acknowledged beyond what was requested) | error |
| SUB-04 | All subsequent subscription notifications → carry `io.modelcontextprotocol/subscriptionId` in `_meta` matching the `id` from the original `subscriptions/listen` request | error |
| SUB-05 | Close the SSE stream from client side → server tears down the subscription cleanly (no leaked resource; re-subscribing with same params works) | warning |

### Category 18: Caching (5) — `appliesTo: ['DRAFT-2026-v1']`

`https://modelcontextprotocol.io/specification/DRAFT-2026-v1/basic/caching`

| ID | Probe → Criterion | Sev |
|---|---|---|
| CACHE-01 | Call `tools/list` → response result has `ttlMs` (non-negative integer) and `cacheScope` string field | error |
| CACHE-02 | Call `prompts/list` → response result has `ttlMs` and `cacheScope` fields | error |
| CACHE-03 | Call `resources/list` and `resources/templates/list` → both responses have `ttlMs` and `cacheScope` fields | error |
| CACHE-04 | Call `resources/read` → response result has `ttlMs` and `cacheScope` fields | error |
| CACHE-05 | Inspect all `cacheScope` values across all cacheable results → MUST be one of `"public"` or `"private"`; no other values accepted | error |

### Category 19: MRTR — Multi Round-Trip Requests (5) — `appliesTo: ['DRAFT-2026-v1']`

`https://modelcontextprotocol.io/specification/DRAFT-2026-v1/basic/mrtr`

Skips if server never returns `InputRequiredResult` during the test run. The MRTR pattern replaces all prior server-initiated requests (`roots/list`, `sampling/createMessage`, `elicitation/create`).

| ID | Probe → Criterion | Sev |
|---|---|---|
| MRTR-01 | If server returns `InputRequiredResult` → `resultType` is `"input_required"` and result contains `inputRequests` or `requestState` or both | error |
| MRTR-02 | Retry the original call including `inputResponses` (matching `inputRequests` keys) and echoing `requestState` byte-for-byte unchanged → server returns a final non-`input_required` result | error |
| MRTR-03 | MRTR MUST NOT appear on methods other than `tools/call`, `resources/read`, or `prompts/get` — if triggered on another method, server returns a normal error instead | error |
| MRTR-04 | Server MUST NOT include `inputRequests` for capabilities the client has not declared → inspect `inputRequests` against client's declared capabilities | error |
| MRTR-05 | Retry with bit-flipped `requestState` (tampered by validator) → server MUST return an error and not accept the tampered state; validates integrity-protection requirement | error |

---

## The Remediation abstraction

Hand-authored fix entries, one per check. Stored as code, not LLM-generated.

```typescript
// packages/core/src/remediations/types.ts
export type Language = 'typescript' | 'python' | 'go' | 'rust' | 'language-agnostic';

export interface RemediationSnippet {
  language: Language;
  framework?: string;            // e.g. 'express', 'fastapi', 'hono', 'mark3labs/mcp-go'
  filename?: string;             // suggested location, e.g. 'src/middleware/origin.ts'
  code: string;                  // copy-pasteable
  explanation: string;           // 2–4 sentences
}

export interface Remediation {
  id: string;                    // e.g. 'R-T-07'
  checkId: string;               // e.g. 'T-07'
  problem: string;               // plain-English what's wrong
  why: string;                   // why it matters (security/interop consequence)
  snippets: RemediationSnippet[]; // one per language/framework
  references: { label: string; url: string }[];
}
```

Each Remediation ships snippets for **TypeScript, Python, Go, and Rust**. ~240 checks × 4 languages = ~960 hand-authored snippets. Big, but tractable — most are 5–15 lines each, and many share a template.

---

## Worked remediation example

This is what one Remediation looks like fully filled out. **R-T-07: Origin header validation.**

```typescript
// packages/core/src/remediations/transport.ts
export const R_T_07: Remediation = {
  id: 'R-T-07',
  checkId: 'T-07',
  problem:
    'Your server accepts requests with an attacker-supplied Origin header. ' +
    'This means a malicious website running in a victim user\'s browser can ' +
    'use DNS rebinding to talk to your MCP server as if it were the victim.',
  why:
    'DNS rebinding attacks bypass same-origin protection by repointing a ' +
    'hostname to 127.0.0.1 after the page loads. Without Origin validation, ' +
    'a malicious site can issue real MCP calls to your local or internal ' +
    'server — invoking tools, reading resources, exfiltrating data. The MCP ' +
    'spec requires HTTP 403 on invalid Origin headers, exactly to prevent this.',
  snippets: [
    {
      language: 'typescript',
      framework: 'hono',
      filename: 'src/middleware/origin.ts',
      code: `import { createMiddleware } from 'hono/factory';

const ALLOWED_ORIGINS = new Set([
  'https://your-app.example.com',
  'http://127.0.0.1:3000',  // local dev
  'http://localhost:3000',
]);

export const validateOrigin = createMiddleware(async (c, next) => {
  const origin = c.req.header('Origin');
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return c.json({
      jsonrpc: '2.0',
      error: { code: -32600, message: 'Origin not allowed' },
    }, 403);
  }
  await next();
});`,
      explanation:
        'Apply this middleware to your MCP endpoint. Requests with an Origin ' +
        'header not in the allowlist get a 403 before any handler runs. ' +
        'Requests without an Origin header (e.g., direct curl) pass through — ' +
        'the spec only requires rejection when Origin is *present and invalid*.',
    },
    {
      language: 'python',
      framework: 'fastapi',
      filename: 'app/middleware/origin.py',
      code: `from fastapi import Request
from fastapi.responses import JSONResponse

ALLOWED_ORIGINS = {
    "https://your-app.example.com",
    "http://127.0.0.1:3000",
    "http://localhost:3000",
}

async def validate_origin(request: Request, call_next):
    origin = request.headers.get("origin")
    if origin and origin not in ALLOWED_ORIGINS:
        return JSONResponse(
            status_code=403,
            content={"jsonrpc": "2.0", "error": {
                "code": -32600, "message": "Origin not allowed"
            }},
        )
    return await call_next(request)

# In main.py:
# app.middleware("http")(validate_origin)`,
      explanation:
        'Register as an HTTP middleware. Mirrors the spec: reject when Origin ' +
        'is present and invalid, allow through otherwise.',
    },
    {
      language: 'go',
      framework: 'mark3labs/mcp-go',
      filename: 'middleware/origin.go',
      code: `package middleware

import "net/http"

var allowedOrigins = map[string]bool{
    "https://your-app.example.com": true,
    "http://127.0.0.1:3000":        true,
    "http://localhost:3000":        true,
}

func ValidateOrigin(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        if origin := r.Header.Get("Origin"); origin != "" && !allowedOrigins[origin] {
            w.Header().Set("Content-Type", "application/json")
            w.WriteHeader(http.StatusForbidden)
            w.Write([]byte(\`{"jsonrpc":"2.0","error":{"code":-32600,"message":"Origin not allowed"}}\`))
            return
        }
        next.ServeHTTP(w, r)
    })
}`,
      explanation:
        'Wrap your MCP HTTP handler with ValidateOrigin. Standard net/http ' +
        'middleware pattern; works with any router.',
    },
    {
      language: 'rust',
      framework: 'axum',
      filename: 'src/middleware/origin.rs',
      code: `use axum::{
    body::Body,
    http::{Request, StatusCode},
    middleware::Next,
    response::Response,
    Json,
};
use serde_json::json;
use std::collections::HashSet;
use once_cell::sync::Lazy;

static ALLOWED_ORIGINS: Lazy<HashSet<&'static str>> = Lazy::new(|| {
    HashSet::from([
        "https://your-app.example.com",
        "http://127.0.0.1:3000",
        "http://localhost:3000",
    ])
});

pub async fn validate_origin(
    req: Request<Body>,
    next: Next,
) -> Result<Response, (StatusCode, Json<serde_json::Value>)> {
    if let Some(origin) = req.headers().get("origin").and_then(|v| v.to_str().ok()) {
        if !ALLOWED_ORIGINS.contains(origin) {
            return Err((
                StatusCode::FORBIDDEN,
                Json(json!({
                    "jsonrpc": "2.0",
                    "error": { "code": -32600, "message": "Origin not allowed" }
                })),
            ));
        }
    }
    Ok(next.run(req).await)
}`,
      explanation:
        'Axum middleware. Returns a 403 with a JSON-RPC error body when Origin ' +
        'is present but not in the allowlist.',
    },
  ],
  references: [
    {
      label: 'MCP spec § Transport Security Warning',
      url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#security-warning',
    },
    {
      label: 'OWASP — DNS Rebinding',
      url: 'https://owasp.org/www-community/attacks/DNS_Rebinding',
    },
  ],
};
```

This is the level of care every Remediation gets. ~960 snippets is a lot, but the *value* is precisely this — devs can fix the bug in 30 seconds instead of 30 minutes of spec-reading.

---

## Build mode

The Builder wizard collects:

1. **Server name** + description
2. **Language** — TypeScript, Python, Go, Rust
3. **SDK pin** — current stable, pinned in `package.json` / `pyproject.toml` / `go.mod` / `Cargo.toml`
4. **Transport** — Streamable HTTP (default), stdio, or both
5. **Auth profile**:
   - None (development only — warns about prod use)
   - Bearer token (custom validation logic)
   - OAuth 2.1 + PKCE + RFC 9728 protected resource metadata (full spec compliance, includes example AS integration)
6. **Capabilities** — tools, resources, prompts, sampling-support, elicitation-support, tasks (each checkbox)
7. **Example primitives** — toggle to scaffold:
   - One example tool (`get_weather` with input/output schemas)
   - One example resource (`README.md` exposure)
   - One example prompt (`code_review` with arguments)
8. **Deployment target** — Vercel, Cloudflare Workers, Docker, bare Node/Python/Go/Rust runtime

Output is a zip (web) or generated directory (CLI). **Every generated project passes `mcp-conformance check` with grade A on first run.** This is the killer hook — `npx mcp-conformance init my-server && cd my-server && npm i && npm start & npx mcp-conformance check http://localhost:3000/mcp` returns an A.

CI in this repo asserts that — any change to templates that breaks an A grade fails the build. Templates and checks evolve together.

### GitHub template repos

For each language, a separate public repo with the same content as the corresponding template:

- `github.com/mcp-conformance/mcp-server-template-ts`
- `github.com/mcp-conformance/mcp-server-template-python`
- `github.com/mcp-conformance/mcp-server-template-go`
- `github.com/mcp-conformance/mcp-server-template-rust`

Each has GitHub's "template repo" flag enabled, so devs can click "Use this template" without the wizard. CI in the monorepo syncs `packages/templates/<lang>/` → corresponding repo on every release.

---

## Starter template structure

Example: TypeScript template.

```
my-mcp-server/
├── src/
│   ├── index.ts                    # Entry point, wires server + transport
│   ├── server.ts                   # MCP server setup, capability declaration
│   ├── transport.ts                # Streamable HTTP transport setup
│   ├── middleware/
│   │   ├── origin.ts               # Origin validation (R-T-07)
│   │   ├── protocol-version.ts     # MCP-Protocol-Version header check (R-T-13)
│   │   ├── session.ts              # MCP-Session-Id management (R-T-08..11)
│   │   └── auth.ts                 # Bearer/OAuth 2.1 (if enabled)
│   ├── primitives/
│   │   ├── tools/
│   │   │   └── get-weather.ts      # Example tool
│   │   ├── resources/
│   │   │   └── readme.ts           # Example resource
│   │   └── prompts/
│   │       └── code-review.ts      # Example prompt
│   └── lib/
│       └── errors.ts               # JSON-RPC error helpers
├── tests/
│   └── conformance.test.ts         # Runs mcp-conformance against the server in-process
├── .github/
│   └── workflows/
│       └── conformance.yml         # GitHub Action: runs validator on every PR
├── package.json                    # Pinned @modelcontextprotocol/sdk + scripts
├── tsconfig.json
├── README.md                       # Quickstart + capability docs + spec citations
└── mcp.json                        # Manifest for MCP Registry (when applicable)
```

Every starter ships with:

- **A conformance test in CI** — the project validates itself on every PR.
- **A README that cites the spec** — not just usage, but which spec sections each piece implements.
- **`mcp.json` registry manifest** — ready to submit when the MCP Registry opens.
- **Comments linking back to checks** — `// Implements T-07: Origin validation` so devs understand *why* each piece exists.
- **A README badge** — `![MCP Conformance Grade A](https://mcpconformance.dev/badge/...)` pre-wired to the server's grade.

---

## Report output mockups

### CLI output

```
$ mcp-conformance check https://api.example.com/mcp --spec 2025-11-25

🔍 mcp-conformance v1.0.0
   Target: https://api.example.com/mcp
   Spec:   2025-11-25

Connecting............................. ✓
Initializing........................... ✓ Example Server v0.4.2
Running 225 checks against 2025-11-25 ─────────────────────────

  Transport          ████████████████░░░░  12/17  (2 fail, 1 warn)
  JSON-RPC           ████████████████████   8/8
  Lifecycle          ████████████████████  11/11
  Capabilities       ████████████████████   6/6
  Tools              ███████████████████░  18/19  (1 warn)
  Resources          ████████████████████  15/15
  Prompts            ████████████████████   8/8
  Sampling           ░░░░░░░░░░░░░░░░░░░░   skip (no sampling triggered)
  Elicitation        ░░░░░░░░░░░░░░░░░░░░   skip
  Utilities          █████████████████░░░  16/18  (2 warn)
  Authorization      ███████████░░░░░░░░░  16/22  (5 fail, 1 warn) ⚠
  Security           █████████████████░░░  12/14  (1 fail, 1 warn)
  Tasks              ░░░░░░░░░░░░░░░░░░░░   skip
  Hygiene            ███████████████████░  13/14  (1 warn)
  Discovery          ░░░░░░░░░░░░░░░░░░░░   skip (2025-11-25 mode)
  Stateless          ░░░░░░░░░░░░░░░░░░░░   skip (2025-11-25 mode)
  Subscriptions      ░░░░░░░░░░░░░░░░░░░░   skip (2025-11-25 mode)
  Caching            ░░░░░░░░░░░░░░░░░░░░   skip (2025-11-25 mode)
  MRTR               ░░░░░░░░░░░░░░░░░░░░   skip (2025-11-25 mode)

──────────────────────────────────────────────────────────────────
  Grade: C   (100/112 error-severity checks passed, 89%)
  Failures: 8   Warnings: 7   Skipped: 34
──────────────────────────────────────────────────────────────────

FAILURES (run with --verbose for full evidence):

  ✗ AUTH-07  Server doesn't validate token audience claim
             → fix:  https://mcpconformance.dev/fix/AUTH-07
             → spec: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization

  ✗ AUTH-10  Server accepts access_token in URL query string
             → fix:  https://mcpconformance.dev/fix/AUTH-10
             → spec: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization

  ✗ T-07    Server doesn't validate Origin header (DNS rebinding risk)
             → fix:  https://mcpconformance.dev/fix/T-07
             → spec: https://modelcontextprotocol.io/specification/2025-11-25/basic/transports

  [... 5 more ...]

Full report: https://mcpconformance.dev/r/k8sQ2nM4
Exit code:   1
```

Exit code is 0 for grade A, 1 otherwise — fits CI.

### Web report card

A single-page report at `/r/<id>`. Layout:

- **Hero**: grade letter (huge), server name + version, spec version, "Run again" + "Share" + "Embed badge" buttons.
- **Category strip**: 19 horizontal bars, each clickable to scroll to that section.
- **Failures first**: each failure as an expandable card with: spec quote, probe (curl-style), response received, "Copy curl", and "Show fix" → opens remediation panel with language tabs.
- **Warnings**: collapsed by default.
- **Passed**: collapsed by default, count only.
- **Raw protocol log**: collapsible panel showing every JSON-RPC message sent/received during the run.
- **Badge embed**: one-click copy of Markdown badge snippet → `![MCP Conformance Grade A](https://mcpconformance.dev/badge/...)`.

### Badge API

```
GET /badge/<base64url-encoded-server-url>.svg
```

Returns a shields.io-style SVG badge reflecting the grade from the most recent scan. Badge is cached at edge; refreshes on next validate run. Every README embedding this badge is a permanent impression driving new users.

---

## CORS proxy

```typescript
// packages/web/app/api/proxy/route.ts
export const runtime = 'edge';

const PRIVATE_IP_PATTERNS = [
  /^10\./, /^127\./, /^169\.254\./, /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^192\.168\./, /^::1$/, /^fc00:/, /^fe80:/,
];

function isValidMcpUrl(raw: string): boolean {
  try {
    const u = new URL(raw);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return false;
    if (u.hostname === 'localhost') return false;
    if (PRIVATE_IP_PATTERNS.some(p => p.test(u.hostname))) return false;
    return true;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  const { url, init } = await req.json();
  if (!isValidMcpUrl(url)) {
    return new Response('Invalid URL', { status: 400 });
  }

  const upstream = await fetch(url, {
    method: init.method,
    headers: init.headers,
    body: init.body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
```

Rate limited per-IP via Vercel KV (50 requests/hour for unauthenticated users).

---

## UI direction

**"Conformance Lab" aesthetic.** Stripe Docs meets Wireshark meets a CI test report.

- Light, editorial, dense-but-clean. Off-white background (`#FAFAF9`), generous whitespace.
- **Typography**: Inter for UI, IBM Plex Mono for protocol output and code snippets.
- **No gradients, no glassmorphism, no AI-slop.** Sharp edges, hairline borders (`#E5E5E4`), 1px shadows.
- **Three-pane layout during a run**:
  - Left: server info card + 19 category tree with running counts
  - Center: live streaming results, newest at bottom
  - Right (collapsible): raw JSON-RPC inspector
- **Report card after run** transforms the center pane: grade letter ~120px tall, per-category bars below, failures expanded.
- **Builder wizard**: single-column, one question per screen, progress dots at top. Final screen shows tree-view preview of generated files before download.
- **Color language**:
  - green `#16A34A` (pass)
  - amber `#D97706` (warn)
  - red `#DC2626` (fail)
  - neutrals: `#FAFAF9` bg, `#171717` text, `#737373` muted
  - accent: deep ink blue `#1E3A8A` for primary actions
- **Code blocks** use `IBM Plex Mono`, `#0A0A0A` on `#F5F5F4`, with copy button top-right and language tabs.
- **Dark mode**: properly designed (not auto-inverted), zinc/slate palette, monospace stays Plex Mono.

The vibe should say *"I take protocols seriously."*

---

## Build phases

MVP-first: ship a tight validator with ~37 checks, then expand. Each phase ends in a shippable artifact. Architecture is built for scale from day one so post-MVP additions are PR-shaped, not refactor-shaped.

### MVP (v1.0) — ships in ~35 hours

| Phase | Deliverable | Time |
|---|---|---|
| P1 | Monorepo + scalable folder layout + `packages/core` types (Check, Confidence, Evidence) + auto-discovery runner that scans `packages/checks/` tree | 4 h |
| P2 | MCP client (declares sampling/elicitation/roots caps) + raw HTTP transport + shared probe helpers (`jsonrpc.ts`, `headers.ts`, `sse.ts`) | 3 h |
| P3 | `torture-server` package: deliberately-broken MCP server used as CI fixture. Asserts every shipped check actually fires correctly. | 3 h |
| P4 | MVP catalog: 8 JSON-RPC + 6 Capabilities + 7 Lifecycle = **21 checks** with full folder structure (`check.ts`, `remediation.ts`, `spec.md`, `fixtures/`, `check.test.ts`) | 5 h |
| P5 | CLI: `mcp-conformance check <url>` with JSON + pretty output, exit code 0/1, `--ignore` flag, `--slow` gate, `--spec` selector | 3 h |
| P6 | MVP catalog continued: 6 Transport + 6 Tools = **12 more checks**. Total: 33. | 5 h |
| P7 | High-confidence Auth subset: AUTH-01, AUTH-02, AUTH-03, AUTH-10 = **4 checks** (the deterministic ones). Total: **~37 MVP checks**. | 3 h |
| P8 | Hand-authored remediations for the ~37 MVP checks, **TypeScript + Python** (two languages for MVP — Python is the most common MCP server language after TS). Go + Rust post-MVP. Each remediation verified end-to-end against torture-server. | 7 h |
| P9 | Shareable reports + badge API shipped in MVP (not deferred). URL-hash-encoded reports require no backend; badge endpoint is 30 lines of edge function. Both are critical for launch-day virality. | 2 h |
| P10 | Run against the official `everything` reference server + 5 public MCP servers. Document expected pass/fail set. Fix any false positives. | 3 h |
| P11 | Publish: npm + GitHub repo + README with screenshots. Launch blog post: "I read the MCP spec like a security auditor — here's what I found." | 4 h |
| **MVP total** | | **~42 h** |

### Post-MVP roadmap (each item is independently shippable)

| Phase | Deliverable | Est |
|---|---|---|
| v1.1 | Web UI: ConnectForm + LiveResults + ReportCard + Vercel deploy with hardened CORS proxy (SSRF protections, DNS pinning, rate limits) | 8 h |
| v1.2 | **stdio transport support** via `--exec "python server.py"` subprocess flag. Unlocks Claude Desktop plugin validation — the largest existing MCP server population. | 8 h |
| v1.3 | Remediations in Go + Rust for the ~37 MVP checks | 8 h |
| v1.4 | Resources + Prompts checks (~23 more) | 6 h |
| v1.5 | GitHub Action wrapper + Marketplace listing | 3 h |
| v1.6 | Remaining Auth checks (AUTH-17..22 + the heuristic ones, with confidence: 'medium'/'heuristic' tags) | 6 h |
| v1.7 | Utilities + Hygiene checks | 6 h |
| v1.8 | Sampling + Elicitation server-side checks (validator declares client caps) | 6 h |
| v1.9 | Tasks category (full spec, including state machine validation) | 6 h |
| v2.0 | Security category + `DRAFT-2026-v1` support (RC, Discovery, Stateless, Subscriptions, Caching, MRTR categories — ~38 new checks) | 10 h |
| v2.1 | **Pro tier launch** — report history, scheduled re-validation, team dashboard, API access, live-grade badge for Pro users | 12 h |
| v2.2 | Build mode: TS + Python starter templates + wizard | 8 h |
| v2.3 | Build mode: Go/Rust templates + GitHub template repos with sync CI | 10 h |
| v2.4 | Suggest mode UI: fix cards with language tabs in web report | 4 h |
| v2.5 | **VS Code extension** — validate MCP server from command palette, inline failure annotations on tool definitions | 10 h |
| v2.6 | **`mcp-conformance fix --apply`** — auto-patch mode: writes all applicable remediations directly to project files (language auto-detected) | 8 h |
| v2.7 | **Public server gallery** — opt-in leaderboard of scanned servers with grades, tags (tools/resources/prompts), and conformance history graph | 6 h |
| v2.8 | **Watch mode** — `mcp-conformance watch <url>` re-runs every 30s; terminal stays live during development | 3 h |
| v2.9 | GitLab CI, CircleCI, Buildkite integration templates | 4 h |

Adding a check post-MVP is one folder, ~30 minutes for the simple ones. The architecture means v1.1 onwards never require touching the engine — only `packages/checks/` and `packages/web/`.

---

## Deploy

```bash
git init && git add . && git commit -m "v1.0"
gh repo create mcp-conformance --public --source=. --push
# vercel.com → Import → root: packages/web → done
cd packages/cli && npm publish --access public
cd ../action && gh marketplace publish
# Push each template to its public repo (CI handles after first manual setup)
```

---

## Launch plan

### Day 0 — Soft launch

1. Publish to GitHub (open source, MIT)
2. Push to npm (`npx mcp-conformance check <url>` works immediately)
3. Deploy Vercel
4. Publish 4 template repos
5. Pre-record a 90-second screen recording: failing server → identify failures → apply fixes → grade A. Post as Loom and tweet embed.
6. **Coordinated launch**: DM 3–5 influential MCP developers 48 hours before. Ask them to post simultaneously on Day 0. Not a favor — give them early access and a personal scan of their own server.
7. Tweet from personal account with the screen recording: "Built mcp-conformance — a validator + builder + suggester for MCP servers. Scanned 15 real servers. Here's what I found. Try it: mcpconformance.dev"
8. Open PRs on the 5 most-starred MCP server repos on GitHub with their conformance report attached. Not spam — PR includes the specific failing checks with fix snippets.

### Day 7–10 — Hard launch

Blog post: *"I scanned 15 public MCP servers — here's what most got wrong."* Concrete findings. No individual naming but transparent about failure patterns. Publish on personal blog + dev.to + Medium.

Cross-post to:
- **Hacker News** ("Show HN: mcp-conformance — MCP server validator with 37 spec checks and auto-fix snippets")
- **Product Hunt** (launch on Tuesday for peak dev traffic; prepare 5 upvotes from existing network)
- MCP Discord (#showcase channel)
- r/LocalLLaMA + r/ClaudeAI
- Anthropic developer community
- Twitter/X thread (screenshots of failing reports from real servers)

### Sustained (Weeks 2–8)

**Weekly "MCP Conformance Report" series:** pick a popular server each week, run the validator, document pass/fail. Tag maintainer (with permission). Format: "Server X: Grade B. 3 failures. Here's how to fix them."

**Contributor flywheel:** open-source repo with "good first issue" labels, check-writing guide in 5 minutes, and public contributor wall in README. Target: 10 external check contributions before Month 2.

### Integration push (Month 2)

- Submit `mcp-conformance` to MCP Registry as official developer tool
- Open PR to official MCP docs adding `mcp-conformance` to "testing your server" section
- Reach out to Anthropic MCP team directly about official endorsement / integration link — the W3C and FHIR analogues both had standards-body backing
- Submit to awesome-mcp-servers lists, awesome-mcp, and curated MCP tool directories
- Direct outreach to @modelcontextprotocol Twitter account for a retweet

---

## Success metrics

| Metric | Target (3 months) |
|---|---|
| GitHub stars (main repo) | 500+ |
| Weekly active validate runs | 200+ |
| Badge embeds in real server READMEs | 50+ |
| Starter templates used (via wizard or GitHub fork) | 100+ |
| Public MCP servers tested and named in blog post follow-ups | 25+ |
| Real bugs fixed in production MCP servers because of the validator | 5+ |
| Linked from official MCP docs as a recommended tool | yes |
| Pro tier paying teams | 10+ (=$290+/month MRR) |
| Inquiries (jobs, consulting, partnerships) | 3+ |
| `mcp-conformance` in MCP Registry | yes |
| External check contributions from community | 10+ |

---

## Out of scope (v1.0)

- **Client-side validation** — this validates servers. A separate `mcp-client-conformance` could validate clients later.
- **Protocol fuzzing** — sending malformed bytes to find crashes. Separate project.
- **2024-11-05 backwards-compat matrix testing** — does this server work with old clients via fallback? v1.1.
- **Roots capability server-side checks** — spec defines few server-side behaviors for roots; revisit when more behaviors land.
- **LLM-generated remediation explanations** — risk of hallucinated fixes. Stays hand-authored. May add an opt-in "explain in my codebase context" feature post-v1.0 if demand is real.
- **Hosted CI dashboard** — running validations on a schedule with history graphs. v2.1 (Pro tier).
- **MCP Apps extension** — interactive UI elements (`text/html;profile=mcp-app`); separate extension, deferred post-v2.
- **OAuth enterprise extensions** — client credentials flow and enterprise-managed authorization; deferred post-v2.
- **`x-mcp-header` base64 encoding format validation** — the `=?base64?{value}?=` sentinel format requires careful parsing; deferred to RC category checks in v2.0.
- **stdio transport** — requires subprocess execution with user-provided commands; security implications for web UI. CLI will support via `--exec` flag in v1.2. Web tool will not support stdio (intentional security boundary).

---

## Spec references

- MCP 2025-11-25: https://modelcontextprotocol.io/specification/2025-11-25
- Changelog 2025-11-25: https://modelcontextprotocol.io/specification/2025-11-25/changelog
- Lifecycle: https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle
- Transports: https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
- Authorization: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
- Security: https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices
- Tools: https://modelcontextprotocol.io/specification/2025-11-25/server/tools
- Resources: https://modelcontextprotocol.io/specification/2025-11-25/server/resources
- Prompts: https://modelcontextprotocol.io/specification/2025-11-25/server/prompts
- Sampling: https://modelcontextprotocol.io/specification/2025-11-25/client/sampling
- Elicitation: https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation
- Tasks: https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/tasks
- Cancellation: https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/cancellation
- Progress: https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/progress
- DRAFT-2026-v1: https://modelcontextprotocol.io/specification/DRAFT-2026-v1
- DRAFT-2026-v1 Changelog: https://modelcontextprotocol.io/specification/DRAFT-2026-v1/changelog
- DRAFT-2026-v1 Subscriptions: https://modelcontextprotocol.io/specification/DRAFT-2026-v1/basic/subscriptions
- DRAFT-2026-v1 MRTR: https://modelcontextprotocol.io/specification/DRAFT-2026-v1/basic/mrtr
- DRAFT-2026-v1 Caching: https://modelcontextprotocol.io/specification/DRAFT-2026-v1/basic/caching
- JSON-RPC 2.0: https://www.jsonrpc.org/specification
- RFC 8707 (Resource Indicators): https://www.rfc-editor.org/rfc/rfc8707.html
- RFC 9728 (Protected Resource Metadata): https://datatracker.ietf.org/doc/html/rfc9728
- RFC 9207 (OAuth Issuer Identification): https://www.rfc-editor.org/rfc/rfc9207.html
- RFC 6570 (URI Templates): https://www.rfc-editor.org/rfc/rfc6570.html
- RFC 5424 (Syslog Severity Levels): https://www.rfc-editor.org/rfc/rfc5424.html
- W3C Trace Context: https://www.w3.org/TR/trace-context/
- OAuth 2.1: https://datatracker.ietf.org/doc/html/draft-ietf-oauth-v2-1-13
