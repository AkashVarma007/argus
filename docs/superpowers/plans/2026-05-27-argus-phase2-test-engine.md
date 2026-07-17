# Argus Phase 2 — Test Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Browser-side MCP conformance test engine that runs the DRAFT-2026-v1 + 2025-11-25 check catalog (~243 checks across 19 categories) over HTTP, SSE, and a local stdio-bridge transport, with a user-runs-local-proxy CORS escape hatch, and the Test surfaces (scan composer, live progress, graded report, drill-in) that consume it.

**Architecture:**

1. **Browser engine** lives entirely in `argus/lib/conformance/`. The runner orchestrates an explicit check registry (no auto-discovery — Webpack bundling cannot scan dynamic folder trees reliably). Each check is one folder under `lib/conformance/checks/<category>/<ID>.<slug>/` exporting a default `Check` object plus a unit test.
2. **Transport abstraction.** A `Transport` interface has two implementations: `HttpTransport` (uses `fetch` directly when CORS allows, or fronted through the user-run `argus-proxy`) and `BridgeTransport` (WebSocket to user-run `argus-bridge` which spawns the server subprocess and pipes stdio). Checks operate against an MCP `Client` that wraps the transport; they may also reach for a `RawHttpClient` to probe transport-level behavior.
3. **Two sidecars** ship as separate, independently-published npm packages outside the static app:
   - `argus-proxy/` — Node + Express, listens on `127.0.0.1:7878`, proxies arbitrary HTTP requests to MCP servers, adds CORS headers, refuses private-network targets except via explicit `--allow-private` flag.
   - `argus-bridge/` — Node + `ws`, listens on `127.0.0.1:7879`, spawns the server subprocess (`--exec "python server.py"`), and bidirectionally pipes JSON-RPC framed lines between WebSocket and child stdio.
4. **`torture-server/`** — third sidecar package, a deliberately-broken HTTP MCP server used by unit + integration tests to verify each check fires on real violations. Co-located in the repo, not published.
5. **UI** lives in `argus/components/test/` and `argus/app/test/`. Three vertical strips during a scan (server card · live results · raw inspector). On finish the centre transforms to a grade reveal + 19-category strip + drillable failures.
6. **Persistence.** Completed scans land in the Phase 1 `useScansStore` keyed by `SCN-####`. The `[scanId]` route renders any persisted scan from `localStorage`.

This phase **builds the engine + transports + sidecars + UI + an initial 60-check catalog spread across all 19 categories** to prove the architecture end-to-end. The remaining ~180 checks are pure folder-additions slated for Phase 3; no engine work is required to land them.

**Tech Stack:** TypeScript 5.7 strict · Zustand 5 · `ajv` 8 (JSON Schema 2020-12 + draft-07) · `eventsource-parser` 3 · `ws` 8 (bridge + tests) · native `fetch` + `WebSocket` in the browser · Node 20 for sidecars · `express` 4 + `cors` 2 for proxy · `commander` 12 for sidecar CLIs · Vitest 2.

---

## File Structure

Files this plan creates or modifies:

```
argus/
├── package.json                                            (MODIFY: add deps)
├── lib/conformance/
│   ├── types.ts                                            (NEW: Check, Evidence, Result)
│   ├── grading.ts                                          (NEW)
│   ├── registry.ts                                         (NEW: explicit check list)
│   ├── runner.ts                                           (NEW)
│   ├── client.ts                                           (NEW: McpClient)
│   ├── transport/
│   │   ├── types.ts                                        (NEW: Transport interface)
│   │   ├── http.ts                                         (NEW: fetch transport + proxy)
│   │   ├── sse.ts                                          (NEW: SSE consumer)
│   │   ├── bridge.ts                                       (NEW: WebSocket transport)
│   │   └── raw.ts                                          (NEW: RawHttpClient)
│   ├── helpers/
│   │   ├── jsonrpc.ts                                      (NEW)
│   │   ├── headers.ts                                      (NEW)
│   │   ├── sse.ts                                          (NEW: probe helpers)
│   │   └── curl.ts                                         (NEW: render curl)
│   └── checks/
│       ├── transport/                                      (NEW: 6 checks)
│       │   ├── T-01.content-type-json/{check,check.test}.ts
│       │   ├── T-03.response-content-type/{check,check.test}.ts
│       │   ├── T-05.notification-202/{check,check.test}.ts
│       │   ├── T-07.origin-validation/{check,check.test}.ts
│       │   ├── T-12.protocol-version-header/{check,check.test}.ts
│       │   └── T-13.protocol-version-rejected/{check,check.test}.ts
│       ├── jsonrpc/                                        (NEW: 9 checks — all of J-01..J-09)
│       │   └── J-01..J-09 (one folder each)
│       ├── lifecycle/                                      (NEW: 5 checks)
│       │   └── L-01,L-02,L-04,L-06,L-09
│       ├── capabilities/                                   (NEW: 6 checks — all of C-01..C-06)
│       │   └── C-01..C-06
│       ├── tools/                                          (NEW: 5 checks)
│       │   └── TL-01,TL-02,TL-05,TL-08,TL-09
│       ├── resources/                                      (NEW: 3 checks)
│       │   └── R-01,R-04,R-07
│       ├── prompts/                                        (NEW: 2 checks)
│       │   └── P-01,P-04
│       ├── sampling/                                       (NEW: 2 checks)
│       │   └── SMP-01,SMP-02
│       ├── elicitation/                                    (NEW: 2 checks)
│       │   └── EL-01,EL-02
│       ├── utilities/                                      (NEW: 3 checks)
│       │   └── U-01,U-04,U-08
│       ├── authorization/                                  (NEW: 4 checks)
│       │   └── AUTH-01,AUTH-02,AUTH-03,AUTH-10
│       ├── security/                                       (NEW: 2 checks)
│       │   └── S-01,S-04
│       ├── tasks/                                          (NEW: 2 checks)
│       │   └── TK-01,TK-02
│       ├── hygiene/                                        (NEW: 3 checks)
│       │   └── H-01,H-02,H-08
│       ├── rc/                                             (NEW: 3 checks, DRAFT-2026-v1)
│       │   └── RC-01,RC-02,RC-03
│       ├── discovery/                                      (NEW: 2 checks, DRAFT-2026-v1)
│       │   └── DISC-01,DISC-02
│       ├── stateless/                                      (NEW: 2 checks, DRAFT-2026-v1)
│       │   └── SL-01,SL-02
│       ├── subscriptions/                                  (NEW: 2 checks, DRAFT-2026-v1)
│       │   └── SUB-01,SUB-02
│       ├── caching/                                        (NEW: 2 checks, DRAFT-2026-v1)
│       │   └── CACHE-01,CACHE-05
│       └── mrtr/                                           (NEW: 2 checks, DRAFT-2026-v1)
│           └── MRTR-01,MRTR-03
├── lib/store/scans.ts                                      (MODIFY: addScanWithId helper)
├── components/test/
│   ├── ScanComposer.tsx + .module.css                      (NEW)
│   ├── LiveProgress.tsx + .module.css                      (NEW)
│   ├── CategoryStrip.tsx + .module.css                     (NEW)
│   ├── GradeReveal.tsx + .module.css                       (NEW)
│   ├── CheckCard.tsx + .module.css                         (NEW)
│   └── RawProtocolLog.tsx + .module.css                    (NEW)
├── app/test/page.tsx                                       (MODIFY: render ScanComposer)
├── app/test/[scanId]/page.tsx                              (MODIFY: render run/report)
└── tests/unit/conformance/                                 (NEW)
    ├── runner.test.ts
    ├── grading.test.ts
    ├── client.test.ts
    └── helpers.test.ts

argus-proxy/                                                (NEW package, sibling to argus/)
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── cli.ts
│   ├── server.ts
│   └── ssrf.ts
└── tests/server.test.ts

argus-bridge/                                               (NEW package, sibling to argus/)
├── package.json
├── tsconfig.json
├── README.md
├── src/
│   ├── cli.ts
│   ├── server.ts
│   └── spawn.ts
└── tests/server.test.ts

torture-server/                                             (NEW package, sibling to argus/)
├── package.json
├── tsconfig.json
├── README.md
└── src/index.ts
```

**File responsibility:** each file is small and focused. `lib/conformance/types.ts` is data types only (no functions). `runner.ts` is orchestration only (does not know about transports beyond the `Transport` interface). Transports do not know about checks. Checks do not know about UI. UI does not know about transport details — it consumes `Scan` objects from the store.

---

## Conventions Used Throughout This Plan

- **Working directory** for every shell command is `/home/nishanth/Desktop/Personal/Akash/MCP Builder` unless stated otherwise.
- **The destructive-guard hook blocks `Bash git commit`.** Commits in this plan are listed verbatim; the executing engineer prefixes the command with `!` (Claude Code) or runs it manually so the user authorizes each commit.
- **TDD discipline:** every code-creating task starts with a failing test, then minimal implementation, then green test, then a commit. Tests that depend on Node-only modules (`http`, `ws`, `child_process`) live under `tests/` in the sidecar package, not in `argus/`.
- **No `any`.** TypeScript strict is enforced; checks that must accept dynamic JSON typed it as `unknown` and narrow.
- **Caveman mode does not apply to plan content** — prose in this plan reads normally.

---

## Group A — Foundation (types, deps, helpers)

### Task 1: Add runtime + dev dependencies

**Files:**
- Modify: `argus/package.json`

- [ ] **Step 1: Add deps to argus**

Run:

```bash
cd argus && pnpm add eventsource-parser ajv ajv-formats
cd argus && pnpm add -D ws @types/ws @types/node
```

Expected: `pnpm-lock.yaml` updates, no compile breakage.

- [ ] **Step 2: Verify typecheck stays green**

Run: `cd argus && pnpm typecheck`
Expected: exit 0, no errors.

- [ ] **Step 3: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/package.json argus/pnpm-lock.yaml && git commit -m "chore(argus): add conformance engine runtime deps (ajv, eventsource-parser)"
```

---

### Task 2: Conformance core types

**Files:**
- Create: `argus/lib/conformance/types.ts`
- Test: `argus/tests/unit/conformance/types.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// argus/tests/unit/conformance/types.test.ts
import { describe, it, expectTypeOf } from 'vitest'
import type {
  Check,
  CheckContext,
  CheckResult,
  Evidence,
  SpecVersion,
  Category,
  Severity,
  Confidence,
  SpecRef,
} from '@/lib/conformance/types'

describe('conformance/types', () => {
  it('exports SpecVersion literal union', () => {
    expectTypeOf<SpecVersion>().toEqualTypeOf<'2025-11-25' | 'DRAFT-2026-v1'>()
  })

  it('exports the 19 categories as a literal union', () => {
    const categories: Category[] = [
      'transport', 'jsonrpc', 'lifecycle', 'capabilities',
      'tools', 'resources', 'prompts',
      'sampling', 'elicitation', 'utilities',
      'authorization', 'security', 'tasks', 'hygiene',
      'rc', 'discovery', 'stateless', 'subscriptions', 'caching', 'mrtr',
    ]
    expectTypeOf(categories[0]).toEqualTypeOf<Category>()
  })

  it('Check has the documented shape', () => {
    expectTypeOf<Check['id']>().toBeString()
    expectTypeOf<Check['severity']>().toEqualTypeOf<Severity>()
    expectTypeOf<Check['confidence']>().toEqualTypeOf<Confidence>()
    expectTypeOf<Check['appliesTo']>().toEqualTypeOf<SpecVersion[]>()
    expectTypeOf<Check['deterministic']>().toBeBoolean()
  })

  it('CheckResult.status is a literal union', () => {
    expectTypeOf<CheckResult['status']>().toEqualTypeOf<'pass' | 'fail' | 'skip' | 'error'>()
  })

  it('Evidence may carry request/response/curl', () => {
    expectTypeOf<Evidence['curlCommand']>().toEqualTypeOf<string | undefined>()
  })

  it('SpecRef carries the cited section + verbatim quote', () => {
    expectTypeOf<SpecRef['url']>().toBeString()
    expectTypeOf<SpecRef['section']>().toBeString()
    expectTypeOf<SpecRef['quote']>().toBeString()
  })

  it('CheckContext exposes client, rawHttp, spec, capabilities, log', () => {
    expectTypeOf<CheckContext['spec']>().toEqualTypeOf<SpecVersion>()
    expectTypeOf<CheckContext['log']>().toBeFunction()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd argus && pnpm test tests/unit/conformance/types.test.ts -- --run`
Expected: FAIL — module `@/lib/conformance/types` not found.

- [ ] **Step 3: Write minimal implementation**

```typescript
// argus/lib/conformance/types.ts
import type { Transport } from './transport/types'

export type SpecVersion = '2025-11-25' | 'DRAFT-2026-v1'

export type Category =
  | 'transport' | 'jsonrpc' | 'lifecycle' | 'capabilities'
  | 'tools' | 'resources' | 'prompts'
  | 'sampling' | 'elicitation' | 'utilities'
  | 'authorization' | 'security' | 'tasks' | 'hygiene'
  | 'rc' | 'discovery' | 'stateless' | 'subscriptions' | 'caching' | 'mrtr'

export type Severity = 'error' | 'warning' | 'info'

export type Confidence = 'high' | 'medium' | 'heuristic'

export type CheckStatus = 'pass' | 'fail' | 'skip' | 'error'

export type CapabilityRequirement =
  | 'tools' | 'resources' | 'prompts' | 'logging'
  | 'completions' | 'tasks' | 'subscribe'

export interface SpecRef {
  url: string
  section: string
  quote: string
}

export interface Evidence {
  request?: {
    method: string
    url?: string
    headers: Record<string, string>
    body?: unknown
  }
  response?: {
    status?: number
    headers: Record<string, string>
    body?: unknown
  }
  expected?: unknown
  actual?: unknown
  notes?: string[]
  curlCommand?: string
}

export interface CheckResult {
  checkId: string
  status: CheckStatus
  message?: string
  durationMs: number
  evidence?: Evidence
}

export interface ServerCapabilities {
  tools?: { listChanged?: boolean }
  resources?: { listChanged?: boolean; subscribe?: boolean }
  prompts?: { listChanged?: boolean }
  logging?: Record<string, never>
  completions?: Record<string, never>
  tasks?: {
    list?: Record<string, never>
    cancel?: Record<string, never>
    requests?: { 'tools/call'?: Record<string, never> }
  }
  subscriptions?: { toolsListChanged?: boolean; resourcesListChanged?: boolean }
}

export interface InitializeResult {
  protocolVersion: string
  capabilities: ServerCapabilities
  serverInfo: { name: string; version: string; title?: string; description?: string }
  instructions?: string
}

export interface CheckContext {
  client: import('./client').McpClient
  rawHttp: import('./transport/raw').RawHttpClient
  transport: Transport
  spec: SpecVersion
  serverInfo: InitializeResult
  capabilities: ServerCapabilities
  log: (msg: string) => void
}

export interface Check {
  id: string
  category: Category
  severity: Severity
  confidence: Confidence
  appliesTo: SpecVersion[]
  title: string
  probe: string
  criterion: string
  specRef: SpecRef
  requires?: CapabilityRequirement[]
  deterministic: boolean
  slow?: boolean
  run(ctx: CheckContext): Promise<CheckResult>
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd argus && pnpm test tests/unit/conformance/types.test.ts -- --run`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/types.ts argus/tests/unit/conformance/types.test.ts && git commit -m "feat(argus): add conformance core types (Check, Evidence, CheckContext)"
```

---

### Task 3: JSON-RPC helper utilities

**Files:**
- Create: `argus/lib/conformance/helpers/jsonrpc.ts`
- Test: `argus/tests/unit/conformance/jsonrpc-helpers.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// argus/tests/unit/conformance/jsonrpc-helpers.test.ts
import { describe, it, expect } from 'vitest'
import {
  buildRequest,
  buildNotification,
  isJsonRpcResponse,
  isJsonRpcError,
  isJsonRpcSuccess,
  nextId,
  hasErrorCode,
} from '@/lib/conformance/helpers/jsonrpc'

describe('jsonrpc helpers', () => {
  it('buildRequest wraps method/params with id + jsonrpc 2.0', () => {
    const req = buildRequest('tools/list', { cursor: 'abc' }, 17)
    expect(req).toEqual({
      jsonrpc: '2.0',
      id: 17,
      method: 'tools/list',
      params: { cursor: 'abc' },
    })
  })

  it('buildRequest omits params when undefined', () => {
    const req = buildRequest('ping', undefined, 1)
    expect(req).toEqual({ jsonrpc: '2.0', id: 1, method: 'ping' })
  })

  it('buildNotification has no id field', () => {
    const n = buildNotification('notifications/initialized')
    expect(n).toEqual({ jsonrpc: '2.0', method: 'notifications/initialized' })
    expect('id' in n).toBe(false)
  })

  it('nextId is monotonic increasing', () => {
    const a = nextId()
    const b = nextId()
    expect(b).toBeGreaterThan(a)
  })

  it('isJsonRpcResponse rejects non-objects', () => {
    expect(isJsonRpcResponse(null)).toBe(false)
    expect(isJsonRpcResponse('x')).toBe(false)
    expect(isJsonRpcResponse({ jsonrpc: '2.0', id: 1, result: {} })).toBe(true)
  })

  it('isJsonRpcError detects error envelope', () => {
    expect(isJsonRpcError({ jsonrpc: '2.0', id: 1, error: { code: -32601, message: 'x' } })).toBe(true)
    expect(isJsonRpcError({ jsonrpc: '2.0', id: 1, result: {} })).toBe(false)
  })

  it('isJsonRpcSuccess detects success envelope', () => {
    expect(isJsonRpcSuccess({ jsonrpc: '2.0', id: 1, result: { ok: 1 } })).toBe(true)
    expect(isJsonRpcSuccess({ jsonrpc: '2.0', id: 1, error: { code: 1, message: 'x' } })).toBe(false)
  })

  it('hasErrorCode matches an exact code', () => {
    const e = { jsonrpc: '2.0', id: 1, error: { code: -32601, message: 'x' } }
    expect(hasErrorCode(e, -32601)).toBe(true)
    expect(hasErrorCode(e, -32602)).toBe(false)
    expect(hasErrorCode({ jsonrpc: '2.0', id: 1, result: {} }, -32601)).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd argus && pnpm test tests/unit/conformance/jsonrpc-helpers.test.ts -- --run`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```typescript
// argus/lib/conformance/helpers/jsonrpc.ts
export type JsonRpcId = string | number

export interface JsonRpcRequest {
  jsonrpc: '2.0'
  id: JsonRpcId
  method: string
  params?: unknown
}

export interface JsonRpcNotification {
  jsonrpc: '2.0'
  method: string
  params?: unknown
}

export interface JsonRpcSuccess {
  jsonrpc: '2.0'
  id: JsonRpcId
  result: unknown
}

export interface JsonRpcError {
  jsonrpc: '2.0'
  id: JsonRpcId | null
  error: { code: number; message: string; data?: unknown }
}

export type JsonRpcResponse = JsonRpcSuccess | JsonRpcError

let _id = 0
export function nextId(): number {
  _id += 1
  return _id
}

export function buildRequest(
  method: string,
  params: unknown | undefined,
  id: JsonRpcId,
): JsonRpcRequest {
  const req: JsonRpcRequest = { jsonrpc: '2.0', id, method }
  if (params !== undefined) req.params = params
  return req
}

export function buildNotification(method: string, params?: unknown): JsonRpcNotification {
  const n: JsonRpcNotification = { jsonrpc: '2.0', method }
  if (params !== undefined) n.params = params
  return n
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null
}

export function isJsonRpcResponse(v: unknown): v is JsonRpcResponse {
  return isObj(v) && v.jsonrpc === '2.0' && ('result' in v || 'error' in v)
}

export function isJsonRpcSuccess(v: unknown): v is JsonRpcSuccess {
  return isObj(v) && v.jsonrpc === '2.0' && 'result' in v && !('error' in v)
}

export function isJsonRpcError(v: unknown): v is JsonRpcError {
  return isObj(v) && v.jsonrpc === '2.0' && 'error' in v && !('result' in v)
}

export function hasErrorCode(v: unknown, code: number): boolean {
  return isJsonRpcError(v) && v.error.code === code
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd argus && pnpm test tests/unit/conformance/jsonrpc-helpers.test.ts -- --run`
Expected: PASS — 7 tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/helpers/jsonrpc.ts argus/tests/unit/conformance/jsonrpc-helpers.test.ts && git commit -m "feat(argus): add JSON-RPC envelope helpers (buildRequest, isJsonRpcError, hasErrorCode)"
```

---

### Task 4: Header + curl helpers

**Files:**
- Create: `argus/lib/conformance/helpers/headers.ts`
- Create: `argus/lib/conformance/helpers/curl.ts`
- Test: `argus/tests/unit/conformance/header-helpers.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// argus/tests/unit/conformance/header-helpers.test.ts
import { describe, it, expect } from 'vitest'
import { normalizeHeaders, headerEquals, headerMatches } from '@/lib/conformance/helpers/headers'
import { renderCurl } from '@/lib/conformance/helpers/curl'

describe('header helpers', () => {
  it('normalizeHeaders lowercases keys, trims values', () => {
    const h = normalizeHeaders({ 'Content-Type': '  application/json ', 'X-Foo': 'bar' })
    expect(h).toEqual({ 'content-type': 'application/json', 'x-foo': 'bar' })
  })

  it('headerEquals is case-insensitive on the key', () => {
    expect(headerEquals({ 'Content-Type': 'application/json' }, 'content-type', 'application/json')).toBe(true)
  })

  it('headerMatches checks a regex against the value', () => {
    const ok = headerMatches({ 'www-authenticate': 'Bearer realm="x", resource_metadata="https://y/.well-known/oauth-protected-resource"' }, 'WWW-Authenticate', /resource_metadata="https:\/\/[^"]+"/)
    expect(ok).toBe(true)
  })
})

describe('curl helper', () => {
  it('renderCurl prints multi-line curl with method, headers, body', () => {
    const c = renderCurl({
      method: 'POST',
      url: 'http://localhost:3845/mcp',
      headers: { 'content-type': 'application/json' },
      body: { jsonrpc: '2.0', id: 1, method: 'ping' },
    })
    expect(c).toContain("curl -X POST 'http://localhost:3845/mcp'")
    expect(c).toContain("-H 'content-type: application/json'")
    expect(c).toContain("-d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"ping\"}'")
  })

  it('renderCurl omits -d for GET', () => {
    const c = renderCurl({ method: 'GET', url: 'http://localhost:3845/mcp', headers: {} })
    expect(c).not.toContain(' -d ')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd argus && pnpm test tests/unit/conformance/header-helpers.test.ts -- --run`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation — `headers.ts`**

```typescript
// argus/lib/conformance/helpers/headers.ts
export function normalizeHeaders(h: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(h)) {
    out[k.toLowerCase()] = v.trim()
  }
  return out
}

export function headerEquals(h: Record<string, string>, key: string, value: string): boolean {
  const n = normalizeHeaders(h)
  return n[key.toLowerCase()] === value
}

export function headerMatches(h: Record<string, string>, key: string, re: RegExp): boolean {
  const v = normalizeHeaders(h)[key.toLowerCase()]
  return typeof v === 'string' && re.test(v)
}
```

- [ ] **Step 4: Write minimal implementation — `curl.ts`**

```typescript
// argus/lib/conformance/helpers/curl.ts
interface CurlInput {
  method: string
  url: string
  headers: Record<string, string>
  body?: unknown
}

export function renderCurl({ method, url, headers, body }: CurlInput): string {
  const lines: string[] = [`curl -X ${method} '${url}'`]
  for (const [k, v] of Object.entries(headers)) {
    lines.push(`  -H '${k}: ${v}'`)
  }
  if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    const payload = typeof body === 'string' ? body : JSON.stringify(body)
    lines.push(`  -d '${payload.replace(/'/g, "'\\''")}'`)
  }
  return lines.join(' \\\n')
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd argus && pnpm test tests/unit/conformance/header-helpers.test.ts -- --run`
Expected: PASS — 5 tests pass.

- [ ] **Step 6: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/helpers/headers.ts argus/lib/conformance/helpers/curl.ts argus/tests/unit/conformance/header-helpers.test.ts && git commit -m "feat(argus): add header + curl helpers"
```

---

### Task 5: SSE probe helper

**Files:**
- Create: `argus/lib/conformance/helpers/sse.ts`
- Test: `argus/tests/unit/conformance/sse-helpers.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// argus/tests/unit/conformance/sse-helpers.test.ts
import { describe, it, expect } from 'vitest'
import { parseSseChunk, collectSseEvents } from '@/lib/conformance/helpers/sse'

describe('sse helpers', () => {
  it('parseSseChunk yields events with data + id', () => {
    const raw =
      'id: 1\n' +
      'event: message\n' +
      'data: {"jsonrpc":"2.0","id":1,"result":{}}\n' +
      '\n' +
      'id: 2\n' +
      'data: {"jsonrpc":"2.0","method":"ping"}\n' +
      '\n'
    const events = parseSseChunk(raw)
    expect(events.length).toBe(2)
    expect(events[0]).toEqual({ id: '1', event: 'message', data: '{"jsonrpc":"2.0","id":1,"result":{}}' })
    expect(events[1].id).toBe('2')
  })

  it('collectSseEvents reads a ReadableStream and stops on the first JSON-RPC response with matching id', async () => {
    const enc = new TextEncoder()
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode('id: 1\ndata: {"jsonrpc":"2.0","method":"notifications/progress","params":{"progressToken":"a","progress":1}}\n\n'))
        c.enqueue(enc.encode('id: 2\ndata: {"jsonrpc":"2.0","id":42,"result":{}}\n\n'))
        c.close()
      },
    })
    const events = await collectSseEvents(body, { stopAtResponseId: 42, timeoutMs: 1000 })
    expect(events.length).toBe(2)
    const last = JSON.parse(events[1].data as string)
    expect(last.id).toBe(42)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd argus && pnpm test tests/unit/conformance/sse-helpers.test.ts -- --run`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```typescript
// argus/lib/conformance/helpers/sse.ts
import { createParser, type EventSourceMessage } from 'eventsource-parser'

export interface SseEvent {
  id?: string
  event?: string
  data: string
  retry?: number
}

export function parseSseChunk(raw: string): SseEvent[] {
  const events: SseEvent[] = []
  const parser = createParser({
    onEvent: (e: EventSourceMessage) => {
      events.push({ id: e.id, event: e.event ?? 'message', data: e.data })
    },
    onRetry: (retry: number) => {
      const last = events[events.length - 1]
      if (last) last.retry = retry
    },
  })
  parser.feed(raw)
  return events
}

interface CollectOptions {
  stopAtResponseId?: number | string
  timeoutMs?: number
  onEvent?: (e: SseEvent) => void
}

export async function collectSseEvents(
  body: ReadableStream<Uint8Array>,
  opts: CollectOptions = {},
): Promise<SseEvent[]> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  const events: SseEvent[] = []
  let done = false

  const parser = createParser({
    onEvent: (e: EventSourceMessage) => {
      const evt: SseEvent = { id: e.id, event: e.event ?? 'message', data: e.data }
      events.push(evt)
      opts.onEvent?.(evt)
      if (opts.stopAtResponseId !== undefined) {
        try {
          const parsed = JSON.parse(evt.data) as { id?: unknown }
          if (parsed && parsed.id === opts.stopAtResponseId) done = true
        } catch {
          // ignore non-JSON events
        }
      }
    },
  })

  const timeoutMs = opts.timeoutMs ?? 30_000
  const start = Date.now()

  while (!done) {
    if (Date.now() - start > timeoutMs) throw new Error(`SSE collect timeout after ${timeoutMs}ms`)
    const { value, done: readerDone } = await reader.read()
    if (readerDone) break
    parser.feed(decoder.decode(value, { stream: true }))
  }

  try { await reader.cancel() } catch { /* stream may already be closed */ }
  return events
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd argus && pnpm test tests/unit/conformance/sse-helpers.test.ts -- --run`
Expected: PASS — 2 tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/helpers/sse.ts argus/tests/unit/conformance/sse-helpers.test.ts && git commit -m "feat(argus): add SSE chunk parser + stream collector"
```

---

## Group B — Transport Layer

### Task 6: Transport interface + Raw HTTP client

**Files:**
- Create: `argus/lib/conformance/transport/types.ts`
- Create: `argus/lib/conformance/transport/raw.ts`
- Test: `argus/tests/unit/conformance/raw-transport.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// argus/tests/unit/conformance/raw-transport.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'

const ORIG_FETCH = globalThis.fetch

afterEach(() => { globalThis.fetch = ORIG_FETCH })

describe('RawHttpClient', () => {
  it('forwards method, headers, body to fetch', async () => {
    const spy = vi.fn().mockResolvedValue(new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } }))
    globalThis.fetch = spy as unknown as typeof fetch
    const client = createRawHttpClient({ url: 'http://localhost:3845/mcp' })
    const res = await client.fetch({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })
    expect(spy).toHaveBeenCalledWith('http://localhost:3845/mcp', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'content-type': 'application/json' }),
      body: '{}',
    }))
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('text/plain')
    expect(await res.text()).toBe('ok')
  })

  it('routes through the proxy URL when configured', async () => {
    const spy = vi.fn().mockResolvedValue(new Response('{}', { status: 200, headers: {} }))
    globalThis.fetch = spy as unknown as typeof fetch
    const client = createRawHttpClient({
      url: 'http://localhost:3845/mcp',
      proxyUrl: 'http://127.0.0.1:7878/proxy',
    })
    await client.fetch({ method: 'GET', headers: {} })
    expect(spy).toHaveBeenCalledWith('http://127.0.0.1:7878/proxy', expect.objectContaining({
      method: 'POST',
    }))
    const init = (spy.mock.calls[0][1] as RequestInit)
    expect(JSON.parse(init.body as string)).toEqual({
      url: 'http://localhost:3845/mcp',
      init: { method: 'GET', headers: {} },
    })
  })

  it('returns parsed headers as a plain record', async () => {
    const spy = vi.fn().mockResolvedValue(new Response('ok', { status: 201, headers: { 'x-a': '1', 'x-b': '2' } }))
    globalThis.fetch = spy as unknown as typeof fetch
    const client = createRawHttpClient({ url: 'http://localhost:3845/mcp' })
    const res = await client.fetch({ method: 'GET', headers: {} })
    expect(res.headers['x-a']).toBe('1')
    expect(res.headers['x-b']).toBe('2')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd argus && pnpm test tests/unit/conformance/raw-transport.test.ts -- --run`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation — `transport/types.ts`**

```typescript
// argus/lib/conformance/transport/types.ts
import type { JsonRpcRequest, JsonRpcNotification, JsonRpcResponse } from '../helpers/jsonrpc'

export type TransportKind = 'http' | 'sse' | 'bridge'

export interface TransportConfig {
  kind: TransportKind
  url: string
  proxyUrl?: string
  protocolVersion: '2025-11-25' | 'DRAFT-2026-v1'
  bridgeCommand?: string
}

export interface Transport {
  kind: TransportKind
  send(req: JsonRpcRequest): Promise<JsonRpcResponse>
  notify(n: JsonRpcNotification): Promise<void>
  close(): Promise<void>
}
```

- [ ] **Step 4: Write minimal implementation — `transport/raw.ts`**

```typescript
// argus/lib/conformance/transport/raw.ts
export interface RawRequest {
  method: string
  headers: Record<string, string>
  body?: string
}

export interface RawResponse {
  status: number
  headers: Record<string, string>
  text(): Promise<string>
  json<T = unknown>(): Promise<T>
}

export interface RawHttpClient {
  readonly url: string
  fetch(req: RawRequest): Promise<RawResponse>
}

export interface CreateRawOpts {
  url: string
  proxyUrl?: string
}

export function createRawHttpClient({ url, proxyUrl }: CreateRawOpts): RawHttpClient {
  return {
    url,
    async fetch(req): Promise<RawResponse> {
      let endpoint = url
      let init: RequestInit = {
        method: req.method,
        headers: req.headers,
        body: req.body,
      }
      if (proxyUrl) {
        endpoint = proxyUrl
        init = {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url, init: { method: req.method, headers: req.headers, body: req.body } }),
        }
      }
      const res = await fetch(endpoint, init)
      const headers: Record<string, string> = {}
      res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v })
      const cachedBody = await res.clone().text()
      return {
        status: res.status,
        headers,
        text: () => Promise.resolve(cachedBody),
        json: <T>() => Promise.resolve(JSON.parse(cachedBody) as T),
      }
    },
  }
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd argus && pnpm test tests/unit/conformance/raw-transport.test.ts -- --run`
Expected: PASS — 3 tests pass.

- [ ] **Step 6: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/transport/types.ts argus/lib/conformance/transport/raw.ts argus/tests/unit/conformance/raw-transport.test.ts && git commit -m "feat(argus): add Transport interface + RawHttpClient with proxy support"
```

---

### Task 7: HTTP transport (JSON + SSE response handling)

**Files:**
- Create: `argus/lib/conformance/transport/http.ts`
- Test: `argus/tests/unit/conformance/http-transport.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// argus/tests/unit/conformance/http-transport.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { buildRequest, buildNotification } from '@/lib/conformance/helpers/jsonrpc'

const ORIG_FETCH = globalThis.fetch

afterEach(() => { globalThis.fetch = ORIG_FETCH })

describe('HttpTransport', () => {
  it('POSTs a request with mandatory headers and returns the parsed response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ jsonrpc: '2.0', id: 1, result: { ok: true } }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )) as unknown as typeof fetch

    const t = createHttpTransport({
      kind: 'http',
      url: 'http://localhost:3845/mcp',
      protocolVersion: '2025-11-25',
    })
    const res = await t.send(buildRequest('ping', undefined, 1))
    expect(res).toEqual({ jsonrpc: '2.0', id: 1, result: { ok: true } })

    const init = ((globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit)
    const hdr = init.headers as Record<string, string>
    expect(hdr['Content-Type']).toBe('application/json')
    expect(hdr['Accept']).toBe('application/json, text/event-stream')
    expect(hdr['MCP-Protocol-Version']).toBe('2025-11-25')
  })

  it('parses a single SSE event body as the response', async () => {
    const sse =
      'event: message\n' +
      'data: {"jsonrpc":"2.0","id":2,"result":{"name":"x"}}\n\n'
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(sse, {
      status: 200, headers: { 'content-type': 'text/event-stream' },
    })) as unknown as typeof fetch

    const t = createHttpTransport({
      kind: 'http',
      url: 'http://localhost:3845/mcp',
      protocolVersion: '2025-11-25',
    })
    const res = await t.send(buildRequest('tools/list', {}, 2))
    expect(res).toEqual({ jsonrpc: '2.0', id: 2, result: { name: 'x' } })
  })

  it('notify expects 202 and returns void', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 202 })) as unknown as typeof fetch
    const t = createHttpTransport({
      kind: 'http',
      url: 'http://localhost:3845/mcp',
      protocolVersion: '2025-11-25',
    })
    await expect(t.notify(buildNotification('notifications/initialized'))).resolves.toBeUndefined()
  })

  it('throws on non-2xx response when sending a request', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response('boom', { status: 500 })) as unknown as typeof fetch
    const t = createHttpTransport({
      kind: 'http',
      url: 'http://localhost:3845/mcp',
      protocolVersion: '2025-11-25',
    })
    await expect(t.send(buildRequest('ping', undefined, 9))).rejects.toThrow(/HTTP 500/)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd argus && pnpm test tests/unit/conformance/http-transport.test.ts -- --run`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```typescript
// argus/lib/conformance/transport/http.ts
import { collectSseEvents } from '../helpers/sse'
import type { JsonRpcRequest, JsonRpcNotification, JsonRpcResponse } from '../helpers/jsonrpc'
import { isJsonRpcResponse } from '../helpers/jsonrpc'
import type { Transport, TransportConfig } from './types'

function mandatoryHeaders(cfg: TransportConfig): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json, text/event-stream',
    'MCP-Protocol-Version': cfg.protocolVersion,
  }
}

async function postViaProxy(cfg: TransportConfig, body: string, headers: Record<string, string>): Promise<Response> {
  if (cfg.proxyUrl) {
    return fetch(cfg.proxyUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url: cfg.url,
        init: { method: 'POST', headers, body },
      }),
    })
  }
  return fetch(cfg.url, { method: 'POST', headers, body })
}

export function createHttpTransport(cfg: TransportConfig): Transport {
  return {
    kind: 'http',
    async send(req: JsonRpcRequest): Promise<JsonRpcResponse> {
      const body = JSON.stringify(req)
      const headers = mandatoryHeaders(cfg)
      const res = await postViaProxy(cfg, body, headers)
      if (!res.ok && res.status !== 200) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
      }
      const contentType = res.headers.get('content-type') ?? ''
      if (contentType.includes('text/event-stream')) {
        if (!res.body) throw new Error('SSE response without body')
        const events = await collectSseEvents(res.body, { stopAtResponseId: req.id, timeoutMs: 30_000 })
        for (const e of events) {
          try {
            const parsed = JSON.parse(e.data) as JsonRpcResponse
            if (isJsonRpcResponse(parsed) && (parsed as { id: unknown }).id === req.id) {
              return parsed
            }
          } catch { /* ignore non-JSON events */ }
        }
        throw new Error(`SSE response did not contain JSON-RPC response with id ${String(req.id)}`)
      }
      const json = (await res.json()) as JsonRpcResponse
      if (!isJsonRpcResponse(json)) throw new Error('Response body is not a JSON-RPC envelope')
      return json
    },
    async notify(n: JsonRpcNotification): Promise<void> {
      const body = JSON.stringify(n)
      const headers = mandatoryHeaders(cfg)
      const res = await postViaProxy(cfg, body, headers)
      if (res.status !== 202 && res.status !== 200) {
        const text = await res.text()
        throw new Error(`Notification HTTP ${res.status}: ${text.slice(0, 200)}`)
      }
    },
    async close() { /* nothing to close for HTTP */ },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd argus && pnpm test tests/unit/conformance/http-transport.test.ts -- --run`
Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/transport/http.ts argus/tests/unit/conformance/http-transport.test.ts && git commit -m "feat(argus): add HTTP transport with SSE response parsing + proxy fallback"
```

---

### Task 8: Bridge transport (stdio over WebSocket)

**Files:**
- Create: `argus/lib/conformance/transport/bridge.ts`
- Test: `argus/tests/unit/conformance/bridge-transport.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// argus/tests/unit/conformance/bridge-transport.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createBridgeTransport, __setWebSocketCtor } from '@/lib/conformance/transport/bridge'
import { buildRequest } from '@/lib/conformance/helpers/jsonrpc'

class FakeWebSocket {
  static instances: FakeWebSocket[] = []
  onopen: (() => void) | null = null
  onmessage: ((e: { data: string }) => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  onclose: (() => void) | null = null
  readyState = 0
  sent: string[] = []
  constructor(public url: string) {
    FakeWebSocket.instances.push(this)
    queueMicrotask(() => { this.readyState = 1; this.onopen?.() })
  }
  send(data: string) { this.sent.push(data) }
  close() { this.readyState = 3; this.onclose?.() }
  emit(data: string) { this.onmessage?.({ data }) }
}

beforeEach(() => {
  FakeWebSocket.instances = []
  __setWebSocketCtor(FakeWebSocket as unknown as typeof WebSocket)
})

describe('BridgeTransport', () => {
  it('opens a websocket with the bridge URL + exec query', async () => {
    const t = createBridgeTransport({
      kind: 'bridge',
      url: 'ws://127.0.0.1:7879/bridge',
      protocolVersion: '2025-11-25',
      bridgeCommand: 'python server.py',
    })
    const promise = t.send(buildRequest('ping', undefined, 1))
    const ws = FakeWebSocket.instances[0]
    expect(ws.url).toContain('ws://127.0.0.1:7879/bridge')
    expect(ws.url).toContain('exec=python%20server.py')
    await new Promise(r => queueMicrotask(r))
    ws.emit(JSON.stringify({ jsonrpc: '2.0', id: 1, result: { ok: 1 } }))
    const res = await promise
    expect(res).toEqual({ jsonrpc: '2.0', id: 1, result: { ok: 1 } })
  })

  it('routes responses to the matching request id', async () => {
    const t = createBridgeTransport({
      kind: 'bridge',
      url: 'ws://127.0.0.1:7879/bridge',
      protocolVersion: '2025-11-25',
      bridgeCommand: 'python s.py',
    })
    const p1 = t.send(buildRequest('a', undefined, 1))
    const p2 = t.send(buildRequest('b', undefined, 2))
    const ws = FakeWebSocket.instances[0]
    await new Promise(r => queueMicrotask(r))
    ws.emit(JSON.stringify({ jsonrpc: '2.0', id: 2, result: 'B' }))
    ws.emit(JSON.stringify({ jsonrpc: '2.0', id: 1, result: 'A' }))
    expect(await p1).toMatchObject({ id: 1, result: 'A' })
    expect(await p2).toMatchObject({ id: 2, result: 'B' })
  })

  it('rejects pending requests on close', async () => {
    const t = createBridgeTransport({
      kind: 'bridge',
      url: 'ws://127.0.0.1:7879/bridge',
      protocolVersion: '2025-11-25',
      bridgeCommand: 'python s.py',
    })
    const p = t.send(buildRequest('ping', undefined, 1))
    const ws = FakeWebSocket.instances[0]
    await new Promise(r => queueMicrotask(r))
    ws.close()
    await expect(p).rejects.toThrow(/bridge closed/i)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd argus && pnpm test tests/unit/conformance/bridge-transport.test.ts -- --run`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```typescript
// argus/lib/conformance/transport/bridge.ts
import type { JsonRpcRequest, JsonRpcNotification, JsonRpcResponse, JsonRpcId } from '../helpers/jsonrpc'
import { isJsonRpcResponse } from '../helpers/jsonrpc'
import type { Transport, TransportConfig } from './types'

type WSCtor = new (url: string) => WebSocket
let _WS: WSCtor = globalThis.WebSocket as unknown as WSCtor

export function __setWebSocketCtor(ctor: WSCtor): void { _WS = ctor }

interface Pending {
  resolve: (r: JsonRpcResponse) => void
  reject: (e: Error) => void
}

export function createBridgeTransport(cfg: TransportConfig): Transport {
  if (!cfg.bridgeCommand) throw new Error('bridge transport requires bridgeCommand')
  const wsUrl = `${cfg.url}?exec=${encodeURIComponent(cfg.bridgeCommand)}&protocol=${cfg.protocolVersion}`
  const ws = new _WS(wsUrl)
  const pending = new Map<JsonRpcId, Pending>()
  const opened: Promise<void> = new Promise((resolve, reject) => {
    ws.onopen = () => resolve()
    ws.onerror = (e) => reject(new Error(`bridge socket error: ${String((e as Event).type ?? e)}`))
  })

  ws.onmessage = (e: MessageEvent) => {
    const data = typeof e.data === 'string' ? e.data : ''
    let parsed: unknown
    try { parsed = JSON.parse(data) } catch { return }
    if (!isJsonRpcResponse(parsed)) return
    const id = (parsed as { id: JsonRpcId }).id
    const p = pending.get(id)
    if (!p) return
    pending.delete(id)
    p.resolve(parsed)
  }

  ws.onclose = () => {
    const err = new Error('bridge closed before response')
    for (const p of pending.values()) p.reject(err)
    pending.clear()
  }

  return {
    kind: 'bridge',
    async send(req: JsonRpcRequest): Promise<JsonRpcResponse> {
      await opened
      return new Promise<JsonRpcResponse>((resolve, reject) => {
        pending.set(req.id, { resolve, reject })
        ws.send(JSON.stringify(req))
      })
    },
    async notify(n: JsonRpcNotification): Promise<void> {
      await opened
      ws.send(JSON.stringify(n))
    },
    async close() {
      try { ws.close() } catch { /* already closed */ }
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd argus && pnpm test tests/unit/conformance/bridge-transport.test.ts -- --run`
Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/transport/bridge.ts argus/tests/unit/conformance/bridge-transport.test.ts && git commit -m "feat(argus): add WebSocket bridge transport for stdio servers"
```

---

## Group C — MCP Client

### Task 9: McpClient (initialize + request lifecycle)

**Files:**
- Create: `argus/lib/conformance/client.ts`
- Test: `argus/tests/unit/conformance/client.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// argus/tests/unit/conformance/client.test.ts
import { describe, it, expect, vi } from 'vitest'
import { createMcpClient } from '@/lib/conformance/client'
import type { Transport } from '@/lib/conformance/transport/types'
import type { JsonRpcRequest, JsonRpcNotification, JsonRpcResponse } from '@/lib/conformance/helpers/jsonrpc'

function fakeTransport(responder: (r: JsonRpcRequest) => JsonRpcResponse): Transport & { notifs: JsonRpcNotification[] } {
  const notifs: JsonRpcNotification[] = []
  return {
    kind: 'http',
    notifs,
    async send(r) { return responder(r) },
    async notify(n) { notifs.push(n) },
    async close() { /* */ },
  } as unknown as Transport & { notifs: JsonRpcNotification[] }
}

describe('McpClient', () => {
  it('initialize sends declared capabilities and stores serverInfo', async () => {
    const transport = fakeTransport((req) => {
      expect(req.method).toBe('initialize')
      const params = req.params as { protocolVersion: string; capabilities: unknown; clientInfo: { name: string } }
      expect(params.protocolVersion).toBe('2025-11-25')
      expect(params.clientInfo.name).toBe('argus')
      return {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          protocolVersion: '2025-11-25',
          capabilities: { tools: {} },
          serverInfo: { name: 'demo', version: '1.0.0' },
        },
      }
    })
    const client = createMcpClient(transport, '2025-11-25')
    const result = await client.initialize()
    expect(result.serverInfo.name).toBe('demo')
    expect(client.capabilities.tools).toBeDefined()
    expect(client.serverInfo?.name).toBe('demo')
  })

  it('emits notifications/initialized after a successful initialize', async () => {
    const t = fakeTransport((req) => ({
      jsonrpc: '2.0',
      id: req.id,
      result: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        serverInfo: { name: 'x', version: '1.0' },
      },
    }))
    const client = createMcpClient(t, '2025-11-25')
    await client.initialize()
    await client.notifyInitialized()
    expect(t.notifs.some((n) => n.method === 'notifications/initialized')).toBe(true)
  })

  it('call() wraps a method and returns result on success', async () => {
    const t = fakeTransport((req) => {
      if (req.method === 'initialize') {
        return {
          jsonrpc: '2.0', id: req.id,
          result: { protocolVersion: '2025-11-25', capabilities: {}, serverInfo: { name: 'x', version: '1' } },
        }
      }
      return { jsonrpc: '2.0', id: req.id, result: { tools: [{ name: 'a' }] } }
    })
    const client = createMcpClient(t, '2025-11-25')
    await client.initialize()
    const r = await client.call('tools/list', {})
    expect(r.result).toEqual({ tools: [{ name: 'a' }] })
  })

  it('call() returns the error envelope without throwing', async () => {
    const t = fakeTransport((req) => {
      if (req.method === 'initialize') {
        return {
          jsonrpc: '2.0', id: req.id,
          result: { protocolVersion: '2025-11-25', capabilities: {}, serverInfo: { name: 'x', version: '1' } },
        }
      }
      return { jsonrpc: '2.0', id: req.id, error: { code: -32601, message: 'no such method' } }
    })
    const client = createMcpClient(t, '2025-11-25')
    await client.initialize()
    const r = await client.call('missing/method', {})
    expect(r.error?.code).toBe(-32601)
  })

  it('declares sampling/elicitation/roots capabilities by default', async () => {
    const captured = vi.fn<(r: JsonRpcRequest) => JsonRpcResponse>((req) => ({
      jsonrpc: '2.0', id: req.id,
      result: { protocolVersion: '2025-11-25', capabilities: {}, serverInfo: { name: 'x', version: '1' } },
    }))
    const t = fakeTransport(captured)
    const client = createMcpClient(t, '2025-11-25')
    await client.initialize()
    const params = captured.mock.calls[0][0].params as { capabilities: { sampling?: unknown; elicitation?: unknown; roots?: unknown } }
    expect(params.capabilities.sampling).toBeDefined()
    expect(params.capabilities.elicitation).toBeDefined()
    expect(params.capabilities.roots).toBeDefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd argus && pnpm test tests/unit/conformance/client.test.ts -- --run`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```typescript
// argus/lib/conformance/client.ts
import { buildNotification, buildRequest, isJsonRpcSuccess, nextId } from './helpers/jsonrpc'
import type { JsonRpcResponse } from './helpers/jsonrpc'
import type { Transport } from './transport/types'
import type { InitializeResult, ServerCapabilities, SpecVersion } from './types'

export interface CallOutcome {
  result?: unknown
  error?: { code: number; message: string; data?: unknown }
  raw: JsonRpcResponse
}

export interface McpClient {
  readonly url: string
  readonly spec: SpecVersion
  capabilities: ServerCapabilities
  serverInfo: InitializeResult['serverInfo'] | null
  initialize(): Promise<InitializeResult>
  notifyInitialized(): Promise<void>
  call(method: string, params?: unknown): Promise<CallOutcome>
  notify(method: string, params?: unknown): Promise<void>
  close(): Promise<void>
}

export function createMcpClient(transport: Transport, spec: SpecVersion, url = ''): McpClient {
  const state: { caps: ServerCapabilities; info: InitializeResult['serverInfo'] | null } = {
    caps: {},
    info: null,
  }

  return {
    url,
    spec,
    get capabilities() { return state.caps },
    get serverInfo() { return state.info },
    set capabilities(c) { state.caps = c },
    set serverInfo(i) { state.info = i },

    async initialize(): Promise<InitializeResult> {
      const req = buildRequest('initialize', {
        protocolVersion: spec,
        capabilities: {
          sampling: { tools: {} },
          elicitation: { form: {}, url: {} },
          roots: { listChanged: true },
        },
        clientInfo: { name: 'argus', version: '0.1.0' },
      }, nextId())
      const res = await transport.send(req)
      if (!isJsonRpcSuccess(res)) {
        throw new Error(`initialize failed: ${JSON.stringify(res)}`)
      }
      const result = res.result as InitializeResult
      state.caps = result.capabilities ?? {}
      state.info = result.serverInfo
      return result
    },

    async notifyInitialized(): Promise<void> {
      await transport.notify(buildNotification('notifications/initialized'))
    },

    async call(method: string, params?: unknown): Promise<CallOutcome> {
      const req = buildRequest(method, params, nextId())
      const res = await transport.send(req)
      if (isJsonRpcSuccess(res)) return { result: res.result, raw: res }
      return { error: res.error, raw: res }
    },

    async notify(method: string, params?: unknown): Promise<void> {
      await transport.notify(buildNotification(method, params))
    },

    async close() { await transport.close() },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd argus && pnpm test tests/unit/conformance/client.test.ts -- --run`
Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/client.ts argus/tests/unit/conformance/client.test.ts && git commit -m "feat(argus): add McpClient (initialize, call, notify) wrapping Transport"
```

---

## Group D — Runner + Registry + Grading

### Task 10: Grading (letter grade calc + summary)

**Files:**
- Create: `argus/lib/conformance/grading.ts`
- Test: `argus/tests/unit/conformance/grading.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// argus/tests/unit/conformance/grading.test.ts
import { describe, it, expect } from 'vitest'
import { computeGrade, summarize } from '@/lib/conformance/grading'
import type { CheckResult } from '@/lib/conformance/types'

const r = (id: string, status: CheckResult['status']): CheckResult => ({
  checkId: id, status, durationMs: 1,
})

describe('grading', () => {
  it('A+ when 100% error-severity checks pass and zero warnings', () => {
    const grade = computeGrade({ errorPass: 50, errorTotal: 50, warningPass: 10, warningTotal: 10 })
    expect(grade).toBe('A+')
  })

  it('A when >=98% error passes', () => {
    expect(computeGrade({ errorPass: 49, errorTotal: 50, warningPass: 10, warningTotal: 10 })).toBe('A')
  })

  it('B+ at 90%', () => {
    expect(computeGrade({ errorPass: 90, errorTotal: 100, warningPass: 10, warningTotal: 10 })).toBe('B+')
  })

  it('C at 75%', () => {
    expect(computeGrade({ errorPass: 75, errorTotal: 100, warningPass: 0, warningTotal: 10 })).toBe('C')
  })

  it('F at 0%', () => {
    expect(computeGrade({ errorPass: 0, errorTotal: 50, warningPass: 0, warningTotal: 10 })).toBe('F')
  })

  it('summarize counts pass/fail/skip/error', () => {
    const results: CheckResult[] = [
      r('a', 'pass'), r('b', 'pass'), r('c', 'fail'),
      r('d', 'skip'), r('e', 'error'),
    ]
    expect(summarize(results)).toEqual({ pass: 2, fail: 1, skip: 1, error: 1 })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd argus && pnpm test tests/unit/conformance/grading.test.ts -- --run`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```typescript
// argus/lib/conformance/grading.ts
import type { CheckResult, Grade } from '../store/types'

export interface GradeInput {
  errorPass: number
  errorTotal: number
  warningPass: number
  warningTotal: number
}

export function computeGrade({ errorPass, errorTotal, warningPass, warningTotal }: GradeInput): Grade {
  if (errorTotal === 0) return 'A+'
  const ratio = errorPass / errorTotal
  const warnRatio = warningTotal === 0 ? 1 : warningPass / warningTotal
  if (ratio === 1 && warnRatio === 1) return 'A+'
  if (ratio >= 0.98) return 'A'
  if (ratio >= 0.95) return 'A-'
  if (ratio >= 0.90) return 'B+'
  if (ratio >= 0.85) return 'B'
  if (ratio >= 0.80) return 'B-'
  if (ratio >= 0.75) return 'C+'
  if (ratio >= 0.70) return 'C'
  if (ratio >= 0.60) return 'C-'
  if (ratio >= 0.50) return 'D'
  return 'F'
}

export interface CountSummary { pass: number; fail: number; skip: number; error: number }

export function summarize(results: CheckResult[]): CountSummary {
  const s: CountSummary = { pass: 0, fail: 0, skip: 0, error: 0 }
  for (const r of results) s[r.status] += 1
  return s
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd argus && pnpm test tests/unit/conformance/grading.test.ts -- --run`
Expected: PASS — 6 tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/grading.ts argus/tests/unit/conformance/grading.test.ts && git commit -m "feat(argus): add grade calculator + result summarizer"
```

---

### Task 11: Check registry (explicit + categorized)

**Files:**
- Create: `argus/lib/conformance/registry.ts`
- Test: `argus/tests/unit/conformance/registry.test.ts`

The registry is intentionally explicit. Adding a new check appends one line — predictable for static bundling. Each check folder exports its `Check` object as the default export of `check.ts`.

- [ ] **Step 1: Write the failing test**

```typescript
// argus/tests/unit/conformance/registry.test.ts
import { describe, it, expect } from 'vitest'
import { listChecks, getCheck, byCategory } from '@/lib/conformance/registry'

describe('check registry', () => {
  it('listChecks returns at least the categories declared in registry.ts', () => {
    const ids = listChecks().map((c) => c.id)
    expect(ids.length).toBeGreaterThan(0)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('byCategory groups checks under their declared category key', () => {
    const groups = byCategory()
    for (const [cat, group] of Object.entries(groups)) {
      for (const c of group) expect(c.category).toBe(cat)
    }
  })

  it('getCheck returns undefined for an unknown id', () => {
    expect(getCheck('XYZ-999')).toBeUndefined()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd argus && pnpm test tests/unit/conformance/registry.test.ts -- --run`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```typescript
// argus/lib/conformance/registry.ts
import type { Check, Category } from './types'

// Each check is imported explicitly. Append a line here when adding a check.
// Order in this array determines run order.
const _checks: Check[] = []

export function registerChecks(...checks: Check[]): void {
  for (const c of checks) {
    if (_checks.find((x) => x.id === c.id)) {
      throw new Error(`duplicate check id: ${c.id}`)
    }
    _checks.push(c)
  }
}

export function listChecks(): readonly Check[] {
  return _checks
}

export function getCheck(id: string): Check | undefined {
  return _checks.find((c) => c.id === id)
}

export function byCategory(): Record<Category, Check[]> {
  const cats = [
    'transport', 'jsonrpc', 'lifecycle', 'capabilities',
    'tools', 'resources', 'prompts',
    'sampling', 'elicitation', 'utilities',
    'authorization', 'security', 'tasks', 'hygiene',
    'rc', 'discovery', 'stateless', 'subscriptions', 'caching', 'mrtr',
  ] as const
  const out = Object.fromEntries(cats.map((c) => [c, [] as Check[]])) as Record<Category, Check[]>
  for (const c of _checks) out[c.category].push(c)
  return out
}

// Seed with at least one synthetic check so the registry's test suite passes
// before real checks land. Real checks register themselves via registerChecks()
// in Task 17 onward; remove this placeholder once T-01 is added.
registerChecks({
  id: '__placeholder__',
  category: 'transport',
  severity: 'info',
  confidence: 'high',
  appliesTo: ['2025-11-25', 'DRAFT-2026-v1'],
  title: 'placeholder check, removed once real checks land',
  probe: 'noop',
  criterion: 'always passes',
  specRef: { url: 'https://modelcontextprotocol.io', section: '§', quote: '' },
  deterministic: true,
  async run() {
    return { checkId: '__placeholder__', status: 'pass', durationMs: 0 }
  },
})
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd argus && pnpm test tests/unit/conformance/registry.test.ts -- --run`
Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/registry.ts argus/tests/unit/conformance/registry.test.ts && git commit -m "feat(argus): add explicit check registry with category grouping"
```

---

### Task 12: Runner (orchestration + skip logic + streaming)

**Files:**
- Create: `argus/lib/conformance/runner.ts`
- Test: `argus/tests/unit/conformance/runner.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// argus/tests/unit/conformance/runner.test.ts
import { describe, it, expect, vi } from 'vitest'
import { runScan } from '@/lib/conformance/runner'
import type { Check, CheckContext } from '@/lib/conformance/types'

function mkCheck(partial: Partial<Check>): Check {
  return {
    id: partial.id ?? 'X-01',
    category: partial.category ?? 'transport',
    severity: partial.severity ?? 'error',
    confidence: 'high',
    appliesTo: partial.appliesTo ?? ['2025-11-25', 'DRAFT-2026-v1'],
    title: 't',
    probe: 'p',
    criterion: 'c',
    specRef: { url: 'http://example.com', section: '§', quote: 'q' },
    deterministic: true,
    requires: partial.requires,
    run: partial.run ?? (async () => ({ checkId: partial.id ?? 'X-01', status: 'pass', durationMs: 1 })),
  }
}

const fakeCtx = (caps: Record<string, unknown> = {}) => ({
  capabilities: caps,
  spec: '2025-11-25' as const,
  serverInfo: { protocolVersion: '2025-11-25', capabilities: {}, serverInfo: { name: 'x', version: '1' } },
}) as unknown as CheckContext

describe('runScan', () => {
  it('runs every applicable check and streams progress events', async () => {
    const events: { id: string; status: string }[] = []
    const checks = [mkCheck({ id: 'A' }), mkCheck({ id: 'B', severity: 'warning' })]
    const result = await runScan(checks, fakeCtx(), {
      onProgress: (id, status) => events.push({ id, status }),
    })
    expect(result.results.length).toBe(2)
    expect(events).toEqual([
      { id: 'A', status: 'start' }, { id: 'A', status: 'pass' },
      { id: 'B', status: 'start' }, { id: 'B', status: 'pass' },
    ])
  })

  it('skips checks whose appliesTo excludes the active spec', async () => {
    const c = mkCheck({ id: 'X', appliesTo: ['DRAFT-2026-v1'] })
    const result = await runScan([c], fakeCtx())
    expect(result.results[0].status).toBe('skip')
  })

  it('skips checks whose requires capability is missing', async () => {
    const c = mkCheck({ id: 'Y', requires: ['tools'] })
    const result = await runScan([c], fakeCtx({}))
    expect(result.results[0].status).toBe('skip')
  })

  it('catches exceptions and emits status=error', async () => {
    const c = mkCheck({
      id: 'Z',
      run: async () => { throw new Error('boom') },
    })
    const result = await runScan([c], fakeCtx())
    expect(result.results[0].status).toBe('error')
    expect(result.results[0].message).toMatch(/boom/)
  })

  it('aborts when AbortSignal fires; remaining checks are skipped', async () => {
    const c1 = mkCheck({ id: 'A' })
    const c2 = mkCheck({ id: 'B' })
    const controller = new AbortController()
    const promise = runScan([c1, c2], fakeCtx(), {
      signal: controller.signal,
      onProgress: (id, status) => { if (id === 'A' && status === 'pass') controller.abort() },
    })
    const result = await promise
    expect(result.results.find((r) => r.checkId === 'B')?.status).toBe('skip')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd argus && pnpm test tests/unit/conformance/runner.test.ts -- --run`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```typescript
// argus/lib/conformance/runner.ts
import type { Check, CheckContext, CheckResult, CheckStatus } from './types'
import { summarize, computeGrade } from './grading'
import type { Grade } from '../store/types'

export interface RunnerOptions {
  signal?: AbortSignal
  onProgress?: (checkId: string, status: 'start' | CheckStatus, result?: CheckResult) => void
}

export interface ScanReport {
  results: CheckResult[]
  grade: Grade
  summary: { pass: number; fail: number; skip: number; error: number }
  durationMs: number
}

function appliesToSpec(check: Check, spec: string): boolean {
  return check.appliesTo.includes(spec as never)
}

function requiresMet(check: Check, caps: CheckContext['capabilities']): boolean {
  if (!check.requires) return true
  return check.requires.every((r) => (caps as Record<string, unknown>)[r] !== undefined)
}

export async function runScan(
  checks: readonly Check[],
  ctx: CheckContext,
  opts: RunnerOptions = {},
): Promise<ScanReport> {
  const start = performance.now()
  const results: CheckResult[] = []
  let aborted = false

  for (const c of checks) {
    if (opts.signal?.aborted) aborted = true
    if (aborted) {
      const r: CheckResult = { checkId: c.id, status: 'skip', message: 'aborted', durationMs: 0 }
      results.push(r)
      opts.onProgress?.(c.id, 'skip', r)
      continue
    }
    if (!appliesToSpec(c, ctx.spec)) {
      const r: CheckResult = { checkId: c.id, status: 'skip', message: `does not apply to ${ctx.spec}`, durationMs: 0 }
      results.push(r)
      opts.onProgress?.(c.id, 'skip', r)
      continue
    }
    if (!requiresMet(c, ctx.capabilities)) {
      const r: CheckResult = { checkId: c.id, status: 'skip', message: `missing capability: ${c.requires?.join(',')}`, durationMs: 0 }
      results.push(r)
      opts.onProgress?.(c.id, 'skip', r)
      continue
    }
    opts.onProgress?.(c.id, 'start')
    const tStart = performance.now()
    try {
      const result = await c.run(ctx)
      const durationMs = result.durationMs || performance.now() - tStart
      const finalized: CheckResult = { ...result, durationMs }
      results.push(finalized)
      opts.onProgress?.(c.id, finalized.status, finalized)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      const r: CheckResult = { checkId: c.id, status: 'error', message, durationMs: performance.now() - tStart }
      results.push(r)
      opts.onProgress?.(c.id, 'error', r)
    }
  }

  const summary = summarize(results)
  // Grade is based on error-severity checks; per-check severity comes from the registry.
  const errorIds = new Set(checks.filter((c) => c.severity === 'error').map((c) => c.id))
  const errorResults = results.filter((r) => errorIds.has(r.checkId) && r.status !== 'skip')
  const errorPass = errorResults.filter((r) => r.status === 'pass').length
  const errorTotal = errorResults.length
  const warnIds = new Set(checks.filter((c) => c.severity === 'warning').map((c) => c.id))
  const warnResults = results.filter((r) => warnIds.has(r.checkId) && r.status !== 'skip')
  const warningPass = warnResults.filter((r) => r.status === 'pass').length
  const warningTotal = warnResults.length

  return {
    results,
    grade: computeGrade({ errorPass, errorTotal, warningPass, warningTotal }),
    summary,
    durationMs: performance.now() - start,
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd argus && pnpm test tests/unit/conformance/runner.test.ts -- --run`
Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/runner.ts argus/tests/unit/conformance/runner.test.ts && git commit -m "feat(argus): add scan runner with skip logic, abort signal, streaming progress"
```

---

## Group E — argus-proxy sidecar (Node CORS proxy)

User runs this locally with `npx argus-proxy`. Listens on `127.0.0.1:7878`, accepts POST `/proxy` with `{ url, init }` body, forwards to target server, returns response with `Access-Control-Allow-Origin: *`. Refuses targets in private IP ranges unless `--allow-private` flag is set.

### Task 13: argus-proxy package skeleton

**Files:**
- Create: `argus-proxy/package.json`
- Create: `argus-proxy/tsconfig.json`
- Create: `argus-proxy/README.md`
- Create: `argus-proxy/.gitignore`

- [ ] **Step 1: Create directory + files**

```bash
mkdir -p argus-proxy/src argus-proxy/tests
```

- [ ] **Step 2: Write `argus-proxy/package.json`**

```json
{
  "name": "argus-proxy",
  "version": "0.1.0",
  "description": "Local CORS proxy for testing MCP servers from the Argus web app",
  "license": "MIT",
  "type": "module",
  "bin": { "argus-proxy": "./dist/cli.js" },
  "main": "./dist/server.js",
  "types": "./dist/server.d.ts",
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc -p .",
    "dev": "tsx src/cli.ts",
    "test": "vitest run",
    "typecheck": "tsc -p . --noEmit"
  },
  "dependencies": {
    "commander": "^12.1.0",
    "cors": "^2.8.5",
    "express": "^4.21.2"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.2",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8",
    "supertest": "^7.0.0",
    "@types/supertest": "^6.0.2"
  },
  "engines": { "node": ">=20" }
}
```

- [ ] **Step 3: Write `argus-proxy/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowImportingTsExtensions": false,
    "verbatimModuleSyntax": false
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 4: Write `argus-proxy/.gitignore`**

```
node_modules/
dist/
*.log
```

- [ ] **Step 5: Write `argus-proxy/README.md`**

```markdown
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
```

- [ ] **Step 6: Install dependencies**

```bash
cd argus-proxy && pnpm install
```

Expected: `pnpm-lock.yaml` created, all deps installed.

- [ ] **Step 7: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus-proxy/package.json argus-proxy/tsconfig.json argus-proxy/.gitignore argus-proxy/README.md argus-proxy/pnpm-lock.yaml && git commit -m "chore(argus-proxy): scaffold sidecar package"
```

---

### Task 14: argus-proxy SSRF guard

**Files:**
- Create: `argus-proxy/src/ssrf.ts`
- Test: `argus-proxy/tests/ssrf.test.ts`
- Create: `argus-proxy/vitest.config.ts`

- [ ] **Step 1: Write `argus-proxy/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
})
```

- [ ] **Step 2: Write the failing test**

```typescript
// argus-proxy/tests/ssrf.test.ts
import { describe, it, expect } from 'vitest'
import { isAllowedTarget } from '../src/ssrf'

describe('SSRF guard', () => {
  it('allows public hostnames by default', () => {
    expect(isAllowedTarget('https://api.example.com/mcp', { allowPrivate: false })).toBe(true)
  })

  it('blocks localhost when allowPrivate is false', () => {
    expect(isAllowedTarget('http://localhost:3845/mcp', { allowPrivate: false })).toBe(false)
    expect(isAllowedTarget('http://127.0.0.1:3845/mcp', { allowPrivate: false })).toBe(false)
  })

  it('blocks RFC1918 IPv4 ranges when allowPrivate is false', () => {
    expect(isAllowedTarget('http://10.0.0.1/x', { allowPrivate: false })).toBe(false)
    expect(isAllowedTarget('http://192.168.1.1/x', { allowPrivate: false })).toBe(false)
    expect(isAllowedTarget('http://172.16.0.1/x', { allowPrivate: false })).toBe(false)
  })

  it('blocks link-local IPv4 169.254.0.0/16', () => {
    expect(isAllowedTarget('http://169.254.169.254/latest/meta-data/', { allowPrivate: false })).toBe(false)
  })

  it('blocks loopback + link-local IPv6', () => {
    expect(isAllowedTarget('http://[::1]/x', { allowPrivate: false })).toBe(false)
    expect(isAllowedTarget('http://[fe80::1]/x', { allowPrivate: false })).toBe(false)
    expect(isAllowedTarget('http://[fc00::1]/x', { allowPrivate: false })).toBe(false)
  })

  it('allows private targets when allowPrivate is true', () => {
    expect(isAllowedTarget('http://localhost:3845/mcp', { allowPrivate: true })).toBe(true)
    expect(isAllowedTarget('http://192.168.1.10/x', { allowPrivate: true })).toBe(true)
  })

  it('rejects non-http(s) schemes always', () => {
    expect(isAllowedTarget('file:///etc/passwd', { allowPrivate: true })).toBe(false)
    expect(isAllowedTarget('ftp://example.com/', { allowPrivate: true })).toBe(false)
    expect(isAllowedTarget('not-a-url', { allowPrivate: true })).toBe(false)
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `cd argus-proxy && pnpm test`
Expected: FAIL — module not found.

- [ ] **Step 4: Write minimal implementation**

```typescript
// argus-proxy/src/ssrf.ts
const PRIVATE_IPV4 = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
]

function isPrivateIpv6(hostname: string): boolean {
  // hostname comes inside [...] for IPv6 URLs; URL strips brackets and gives the literal
  const h = hostname.toLowerCase()
  return h === '::1' || h.startsWith('fe80:') || h.startsWith('fc00:') || h.startsWith('fd')
}

export interface GuardOpts { allowPrivate: boolean }

export function isAllowedTarget(raw: string, opts: GuardOpts): boolean {
  let u: URL
  try { u = new URL(raw) } catch { return false }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
  if (opts.allowPrivate) return true
  const host = u.hostname.toLowerCase()
  if (host === 'localhost') return false
  if (PRIVATE_IPV4.some((p) => p.test(host))) return false
  if (host.includes(':') && isPrivateIpv6(host)) return false
  return true
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd argus-proxy && pnpm test`
Expected: PASS — 7 tests pass.

- [ ] **Step 6: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus-proxy/src/ssrf.ts argus-proxy/tests/ssrf.test.ts argus-proxy/vitest.config.ts && git commit -m "feat(argus-proxy): SSRF guard for private + non-http targets"
```

---

### Task 15: argus-proxy Express server

**Files:**
- Create: `argus-proxy/src/server.ts`
- Test: `argus-proxy/tests/server.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// argus-proxy/tests/server.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/server'

const ORIG_FETCH = globalThis.fetch

beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }),
  ) as unknown as typeof fetch
})
afterEach(() => { globalThis.fetch = ORIG_FETCH })

describe('argus-proxy server', () => {
  it('GET /health returns 200 ok', async () => {
    const app = createApp({ allowPrivate: false })
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('POST /proxy forwards request and returns the upstream body', async () => {
    const app = createApp({ allowPrivate: false })
    const res = await request(app)
      .post('/proxy')
      .send({ url: 'https://api.example.com/mcp', init: { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' } })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(res.headers['access-control-allow-origin']).toBe('*')
    expect(globalThis.fetch).toHaveBeenCalledWith('https://api.example.com/mcp', expect.objectContaining({ method: 'POST' }))
  })

  it('rejects disallowed targets with 400', async () => {
    const app = createApp({ allowPrivate: false })
    const res = await request(app)
      .post('/proxy')
      .send({ url: 'http://localhost:3845/mcp', init: { method: 'GET', headers: {} } })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/not allowed/i)
  })

  it('permits private targets when configured', async () => {
    const app = createApp({ allowPrivate: true })
    const res = await request(app)
      .post('/proxy')
      .send({ url: 'http://localhost:3845/mcp', init: { method: 'GET', headers: {} } })
    expect(res.status).toBe(200)
  })

  it('400 when url is missing', async () => {
    const app = createApp({ allowPrivate: true })
    const res = await request(app).post('/proxy').send({ init: { method: 'GET', headers: {} } })
    expect(res.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd argus-proxy && pnpm test tests/server.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```typescript
// argus-proxy/src/server.ts
import express, { type Express, type Request, type Response } from 'express'
import cors from 'cors'
import { isAllowedTarget } from './ssrf.js'

export interface ServerOptions { allowPrivate: boolean }

interface ProxyBody {
  url?: unknown
  init?: { method?: unknown; headers?: unknown; body?: unknown }
}

export function createApp({ allowPrivate }: ServerOptions): Express {
  const app = express()
  app.use(cors({ origin: '*', methods: ['POST', 'GET', 'OPTIONS'] }))
  app.use(express.json({ limit: '4mb' }))

  app.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.post('/proxy', async (req: Request, res: Response) => {
    const body = req.body as ProxyBody
    if (typeof body?.url !== 'string') {
      res.status(400).json({ error: 'url is required' })
      return
    }
    if (!isAllowedTarget(body.url, { allowPrivate })) {
      res.status(400).json({ error: 'target not allowed (private network or non-http scheme)' })
      return
    }
    const init = body.init ?? {}
    try {
      const upstream = await fetch(body.url, {
        method: typeof init.method === 'string' ? init.method : 'GET',
        headers: (init.headers as Record<string, string>) ?? {},
        body: typeof init.body === 'string' ? init.body : undefined,
      })
      const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
      res.status(upstream.status).setHeader('content-type', contentType)
      if (contentType.includes('text/event-stream') && upstream.body) {
        res.setHeader('cache-control', 'no-cache')
        res.setHeader('x-accel-buffering', 'no')
        const reader = upstream.body.getReader()
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          res.write(Buffer.from(value))
        }
        res.end()
        return
      }
      const buf = Buffer.from(await upstream.arrayBuffer())
      res.send(buf)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      res.status(502).json({ error: `upstream fetch failed: ${message}` })
    }
  })

  return app
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd argus-proxy && pnpm test tests/server.test.ts`
Expected: PASS — 5 tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus-proxy/src/server.ts argus-proxy/tests/server.test.ts && git commit -m "feat(argus-proxy): Express server with CORS, SSRF guard, SSE passthrough"
```

---

### Task 16: argus-proxy CLI entry

**Files:**
- Create: `argus-proxy/src/cli.ts`

- [ ] **Step 1: Write the CLI entry**

```typescript
// argus-proxy/src/cli.ts
#!/usr/bin/env node
import { Command } from 'commander'
import { createApp } from './server.js'

const program = new Command()
program
  .name('argus-proxy')
  .description('Local CORS proxy for testing MCP servers from the Argus web app')
  .option('-p, --port <port>', 'port to listen on', '7878')
  .option('-h, --host <host>', 'host to bind to (default: 127.0.0.1)', '127.0.0.1')
  .option('--allow-private', 'permit targets on private/loopback networks', false)
  .parse(process.argv)

const opts = program.opts<{ port: string; host: string; allowPrivate: boolean }>()
const app = createApp({ allowPrivate: opts.allowPrivate })
const port = Number(opts.port)
if (Number.isNaN(port) || port <= 0) {
  console.error(`Invalid --port: ${opts.port}`)
  process.exit(1)
}
app.listen(port, opts.host, () => {
  // eslint-disable-next-line no-console
  console.log(`argus-proxy listening on http://${opts.host}:${port}/proxy (allowPrivate=${opts.allowPrivate})`)
})
```

- [ ] **Step 2: Smoke-test the CLI**

```bash
cd argus-proxy && pnpm dev -- --port 0 &
sleep 1
kill %1 2>/dev/null || true
```

Expected: prints a "listening on…" line, exits when killed. (Port 0 causes Node to pick a free port; we kill before binding logic asserts anything.)

- [ ] **Step 3: Build to confirm package compiles**

```bash
cd argus-proxy && pnpm build
```

Expected: emits `dist/cli.js` and `dist/server.js`, no errors.

- [ ] **Step 4: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus-proxy/src/cli.ts && git commit -m "feat(argus-proxy): CLI entry with port + allow-private flags"
```

---

## Group F — argus-bridge sidecar (stdio over WebSocket)

User runs `npx argus-bridge` locally; browser connects via `ws://127.0.0.1:7879/bridge?exec=<command>&protocol=<spec>` and the bridge spawns the subprocess, piping JSON-RPC messages line-by-line between the WebSocket and child stdin/stdout.

### Task 17: argus-bridge package skeleton

**Files:**
- Create: `argus-bridge/package.json`
- Create: `argus-bridge/tsconfig.json`
- Create: `argus-bridge/.gitignore`
- Create: `argus-bridge/README.md`
- Create: `argus-bridge/vitest.config.ts`

- [ ] **Step 1: Create directory + files**

```bash
mkdir -p argus-bridge/src argus-bridge/tests
```

- [ ] **Step 2: Write `argus-bridge/package.json`**

```json
{
  "name": "argus-bridge",
  "version": "0.1.0",
  "description": "WebSocket-to-stdio bridge for testing stdio-only MCP servers from the Argus web app",
  "license": "MIT",
  "type": "module",
  "bin": { "argus-bridge": "./dist/cli.js" },
  "main": "./dist/server.js",
  "files": ["dist", "README.md"],
  "scripts": {
    "build": "tsc -p .",
    "dev": "tsx src/cli.ts",
    "test": "vitest run",
    "typecheck": "tsc -p . --noEmit"
  },
  "dependencies": {
    "commander": "^12.1.0",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "@types/node": "^22.10.2",
    "@types/ws": "^8.5.13",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  },
  "engines": { "node": ">=20" }
}
```

- [ ] **Step 3: Write `argus-bridge/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "declaration": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": false
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 4: Write `argus-bridge/.gitignore`**

```
node_modules/
dist/
*.log
```

- [ ] **Step 5: Write `argus-bridge/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'], testTimeout: 10_000 },
})
```

- [ ] **Step 6: Write `argus-bridge/README.md`**

```markdown
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
```

- [ ] **Step 7: Install + commit**

```bash
cd argus-bridge && pnpm install
```

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus-bridge/package.json argus-bridge/tsconfig.json argus-bridge/.gitignore argus-bridge/README.md argus-bridge/vitest.config.ts argus-bridge/pnpm-lock.yaml && git commit -m "chore(argus-bridge): scaffold sidecar package"
```

---

### Task 18: Subprocess spawn helper

**Files:**
- Create: `argus-bridge/src/spawn.ts`
- Test: `argus-bridge/tests/spawn.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// argus-bridge/tests/spawn.test.ts
import { describe, it, expect } from 'vitest'
import { parseExec, spawnChild } from '../src/spawn'

describe('parseExec', () => {
  it('splits on whitespace', () => {
    expect(parseExec('python server.py --port 9000', { allowShell: false }))
      .toEqual({ command: 'python', args: ['server.py', '--port', '9000'] })
  })

  it('rejects shell metacharacters without --allow-shell', () => {
    expect(() => parseExec('echo hi | nc evil.com 80', { allowShell: false })).toThrow(/shell/i)
    expect(() => parseExec('rm -rf / ; ls', { allowShell: false })).toThrow(/shell/i)
    expect(() => parseExec('foo `whoami`', { allowShell: false })).toThrow(/shell/i)
  })

  it('permits metacharacters when allowShell is true', () => {
    expect(parseExec('sh -c "echo hi"', { allowShell: true }).command).toBe('sh')
  })

  it('rejects empty exec', () => {
    expect(() => parseExec('', { allowShell: false })).toThrow(/empty/i)
    expect(() => parseExec('   ', { allowShell: false })).toThrow(/empty/i)
  })
})

describe('spawnChild', () => {
  it('echoes stdin to stdout line by line', async () => {
    const child = spawnChild({ command: 'cat', args: [] })
    const out: string[] = []
    child.onLine((l) => out.push(l))
    child.write('hello\n')
    child.write('world\n')
    await new Promise((r) => setTimeout(r, 100))
    child.close()
    expect(out).toContain('hello')
    expect(out).toContain('world')
  })

  it('fires onExit when the child terminates', async () => {
    const child = spawnChild({ command: 'node', args: ['-e', 'process.exit(0)'] })
    const code = await new Promise<number | null>((resolve) => {
      child.onExit((c) => resolve(c))
    })
    expect(code).toBe(0)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd argus-bridge && pnpm test tests/spawn.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```typescript
// argus-bridge/src/spawn.ts
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { createInterface } from 'node:readline'

const SHELL_METACHAR = /[;|&`$<>()*?{}\[\]\\!#~]/

export interface ParseOpts { allowShell: boolean }

export interface ParsedExec {
  command: string
  args: string[]
}

export function parseExec(raw: string, opts: ParseOpts): ParsedExec {
  const trimmed = raw.trim()
  if (trimmed.length === 0) throw new Error('exec is empty')
  if (!opts.allowShell && SHELL_METACHAR.test(trimmed)) {
    throw new Error('shell metacharacters in exec are blocked; pass --allow-shell to override')
  }
  const tokens = tokenize(trimmed)
  const [command, ...args] = tokens
  return { command, args }
}

function tokenize(s: string): string[] {
  const out: string[] = []
  let cur = ''
  let quote: '"' | "'" | null = null
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (quote) {
      if (ch === quote) { quote = null; continue }
      cur += ch
      continue
    }
    if (ch === '"' || ch === "'") { quote = ch; continue }
    if (/\s/.test(ch)) {
      if (cur.length) { out.push(cur); cur = '' }
      continue
    }
    cur += ch
  }
  if (cur.length) out.push(cur)
  return out
}

export interface SpawnedChild {
  write(line: string): void
  onLine(cb: (line: string) => void): void
  onExit(cb: (code: number | null) => void): void
  onStderr(cb: (line: string) => void): void
  close(): void
}

export function spawnChild({ command, args }: ParsedExec): SpawnedChild {
  const child: ChildProcessWithoutNullStreams = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] })
  const stdoutRl = createInterface({ input: child.stdout })
  const stderrRl = createInterface({ input: child.stderr })
  const lineHandlers: ((l: string) => void)[] = []
  const stderrHandlers: ((l: string) => void)[] = []
  const exitHandlers: ((c: number | null) => void)[] = []
  stdoutRl.on('line', (l) => lineHandlers.forEach((h) => h(l)))
  stderrRl.on('line', (l) => stderrHandlers.forEach((h) => h(l)))
  child.on('exit', (code) => exitHandlers.forEach((h) => h(code)))

  return {
    write(line) { child.stdin.write(line) },
    onLine(cb) { lineHandlers.push(cb) },
    onStderr(cb) { stderrHandlers.push(cb) },
    onExit(cb) { exitHandlers.push(cb) },
    close() {
      try { child.stdin.end() } catch { /* may already be closed */ }
      child.kill('SIGTERM')
    },
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd argus-bridge && pnpm test tests/spawn.test.ts`
Expected: PASS — 6 tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus-bridge/src/spawn.ts argus-bridge/tests/spawn.test.ts && git commit -m "feat(argus-bridge): subprocess spawn + exec parsing with shell-metacharacter guard"
```

---

### Task 19: WebSocket server (handshake + frame piping)

**Files:**
- Create: `argus-bridge/src/server.ts`
- Test: `argus-bridge/tests/server.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// argus-bridge/tests/server.test.ts
import { describe, it, expect } from 'vitest'
import WebSocket from 'ws'
import { createBridgeServer } from '../src/server'

async function open(port: number, qs: string): Promise<WebSocket> {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/bridge?${qs}`)
  await new Promise<void>((resolve, reject) => {
    ws.once('open', () => resolve())
    ws.once('error', reject)
  })
  return ws
}

describe('argus-bridge server', () => {
  it('pipes WebSocket text frames to child stdin and child stdout back as text frames', async () => {
    const srv = createBridgeServer({ allowShell: false })
    await new Promise<void>((r) => srv.server.listen(0, '127.0.0.1', () => r()))
    const { port } = srv.server.address() as { port: number }
    const ws = await open(port, `exec=${encodeURIComponent('cat')}&protocol=2025-11-25`)
    const messages: string[] = []
    ws.on('message', (data) => messages.push(data.toString()))
    ws.send('{"jsonrpc":"2.0","id":1,"method":"ping"}')
    await new Promise((r) => setTimeout(r, 150))
    expect(messages).toContain('{"jsonrpc":"2.0","id":1,"method":"ping"}')
    ws.close()
    await new Promise((r) => srv.close(r))
  })

  it('closes the WebSocket with code 4001 when exec is missing', async () => {
    const srv = createBridgeServer({ allowShell: false })
    await new Promise<void>((r) => srv.server.listen(0, '127.0.0.1', () => r()))
    const { port } = srv.server.address() as { port: number }
    const ws = new WebSocket(`ws://127.0.0.1:${port}/bridge?protocol=2025-11-25`)
    const closeCode = await new Promise<number>((resolve) => {
      ws.once('close', (code) => resolve(code))
    })
    expect(closeCode).toBe(4001)
    await new Promise((r) => srv.close(r))
  })

  it('rejects shell-metacharacter exec with close code 4002', async () => {
    const srv = createBridgeServer({ allowShell: false })
    await new Promise<void>((r) => srv.server.listen(0, '127.0.0.1', () => r()))
    const { port } = srv.server.address() as { port: number }
    const ws = new WebSocket(`ws://127.0.0.1:${port}/bridge?exec=${encodeURIComponent('cat | nc evil 80')}&protocol=2025-11-25`)
    const closeCode = await new Promise<number>((resolve) => {
      ws.once('close', (code) => resolve(code))
    })
    expect(closeCode).toBe(4002)
    await new Promise((r) => srv.close(r))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd argus-bridge && pnpm test tests/server.test.ts`
Expected: FAIL.

- [ ] **Step 3: Write minimal implementation**

```typescript
// argus-bridge/src/server.ts
import { createServer, type Server } from 'node:http'
import { WebSocketServer, type WebSocket } from 'ws'
import { parseExec, spawnChild } from './spawn.js'

export interface ServerOptions { allowShell: boolean }

export interface BridgeServer {
  server: Server
  close(cb?: () => void): void
}

export function createBridgeServer({ allowShell }: ServerOptions): BridgeServer {
  const server = createServer()
  const wss = new WebSocketServer({ noServer: true })

  server.on('upgrade', (req, socket, head) => {
    if (!req.url?.startsWith('/bridge')) {
      socket.destroy()
      return
    }
    wss.handleUpgrade(req, socket, head, (ws) => handleConnection(ws, req.url ?? '', allowShell))
  })

  return {
    server,
    close(cb) {
      wss.close()
      server.close(cb ?? (() => undefined))
    },
  }
}

function handleConnection(ws: WebSocket, urlPath: string, allowShell: boolean): void {
  const u = new URL(urlPath, 'http://127.0.0.1')
  const exec = u.searchParams.get('exec')
  if (!exec) {
    ws.close(4001, 'missing exec query param')
    return
  }
  let parsed
  try {
    parsed = parseExec(exec, { allowShell })
  } catch (e) {
    ws.close(4002, e instanceof Error ? e.message : 'bad exec')
    return
  }
  const child = spawnChild(parsed)
  child.onLine((line) => {
    if (ws.readyState === ws.OPEN) ws.send(line)
  })
  child.onStderr((line) => {
    // eslint-disable-next-line no-console
    console.error(`[argus-bridge stderr] ${line}`)
  })
  child.onExit((code) => {
    if (ws.readyState === ws.OPEN) ws.close(4003, `child exited code=${code}`)
  })
  ws.on('message', (data) => {
    const text = data.toString()
    child.write(text.endsWith('\n') ? text : text + '\n')
  })
  ws.on('close', () => child.close())
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd argus-bridge && pnpm test tests/server.test.ts`
Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus-bridge/src/server.ts argus-bridge/tests/server.test.ts && git commit -m "feat(argus-bridge): WebSocket server piping JSON-RPC frames to child stdio"
```

---

### Task 20: argus-bridge CLI entry

**Files:**
- Create: `argus-bridge/src/cli.ts`

- [ ] **Step 1: Write the CLI**

```typescript
// argus-bridge/src/cli.ts
#!/usr/bin/env node
import { Command } from 'commander'
import { createBridgeServer } from './server.js'

const program = new Command()
program
  .name('argus-bridge')
  .description('WebSocket-to-stdio bridge for testing stdio-only MCP servers')
  .option('-p, --port <port>', 'port to listen on', '7879')
  .option('-h, --host <host>', 'host to bind to', '127.0.0.1')
  .option('--allow-shell', 'permit shell metacharacters in exec strings', false)
  .parse(process.argv)

const opts = program.opts<{ port: string; host: string; allowShell: boolean }>()
const { server } = createBridgeServer({ allowShell: opts.allowShell })
const port = Number(opts.port)
if (Number.isNaN(port) || port <= 0) {
  console.error(`Invalid --port: ${opts.port}`)
  process.exit(1)
}
server.listen(port, opts.host, () => {
  // eslint-disable-next-line no-console
  console.log(`argus-bridge listening on ws://${opts.host}:${port}/bridge (allowShell=${opts.allowShell})`)
})
```

- [ ] **Step 2: Build to confirm it compiles**

```bash
cd argus-bridge && pnpm build
```

Expected: emits `dist/cli.js`, `dist/server.js`, `dist/spawn.js`, no errors.

- [ ] **Step 3: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus-bridge/src/cli.ts && git commit -m "feat(argus-bridge): CLI entry with port + allow-shell flags"
```

---

## Group G — torture-server (broken MCP server for integration tests)

A deliberately-broken HTTP MCP server. Every check that ships in this plan should fire (produce status `fail`) against a configurable subset of broken behaviors. Argus's check unit tests pull individual responses out of this server via `supertest`.

### Task 21: torture-server package skeleton

**Files:**
- Create: `torture-server/package.json`
- Create: `torture-server/tsconfig.json`
- Create: `torture-server/.gitignore`
- Create: `torture-server/README.md`
- Create: `torture-server/vitest.config.ts`

- [ ] **Step 1: Create directory**

```bash
mkdir -p torture-server/src torture-server/tests
```

- [ ] **Step 2: Write `torture-server/package.json`**

```json
{
  "name": "torture-server",
  "version": "0.0.0",
  "private": true,
  "description": "Deliberately-broken MCP server used as a fixture for Argus check tests",
  "license": "MIT",
  "type": "module",
  "main": "./src/index.ts",
  "scripts": {
    "dev": "tsx src/index.ts",
    "test": "vitest run",
    "typecheck": "tsc -p . --noEmit"
  },
  "dependencies": {
    "express": "^4.21.2"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/node": "^22.10.2",
    "@types/supertest": "^6.0.2",
    "supertest": "^7.0.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "vitest": "^2.1.8"
  },
  "engines": { "node": ">=20" }
}
```

- [ ] **Step 3: Write `torture-server/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "rootDir": "src",
    "verbatimModuleSyntax": false,
    "noEmit": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

- [ ] **Step 4: Write `torture-server/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
export default defineConfig({ test: { environment: 'node', include: ['tests/**/*.test.ts'] } })
```

- [ ] **Step 5: Write `torture-server/.gitignore`**

```
node_modules/
*.log
```

- [ ] **Step 6: Write `torture-server/README.md`**

```markdown
# torture-server

A deliberately-broken MCP server. Every check in Argus that has a corresponding "bad" behavior here is expected to fire against this server.

This server is not published. It exists only as a fixture in this repo.

## Switches

Boot-time flags toggle individual violations on/off so individual checks can be unit-tested against just the behavior they target.

```bash
pnpm dev -- --bad T-07 J-04 R-04
```

The unit tests in `argus/tests/unit/conformance/checks/` boot a per-test instance with only the relevant switches enabled.
```

- [ ] **Step 7: Install + commit**

```bash
cd torture-server && pnpm install
```

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add torture-server/package.json torture-server/tsconfig.json torture-server/.gitignore torture-server/README.md torture-server/vitest.config.ts torture-server/pnpm-lock.yaml && git commit -m "chore(torture-server): scaffold fixture package"
```

---

### Task 22: torture-server core (Express + violations toggled by flag)

**Files:**
- Create: `torture-server/src/index.ts`
- Create: `torture-server/src/violations.ts`
- Test: `torture-server/tests/smoke.test.ts`

- [ ] **Step 1: Write the failing smoke test**

```typescript
// torture-server/tests/smoke.test.ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createTortureApp } from '../src/index'

describe('torture-server smoke', () => {
  it('initialize returns a result envelope', async () => {
    const app = createTortureApp({ violations: new Set() })
    const res = await request(app)
      .post('/mcp')
      .set('content-type', 'application/json')
      .set('mcp-protocol-version', '2025-11-25')
      .send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 't', version: '1' } } })
    expect(res.status).toBe(200)
    expect(res.body.result.serverInfo.name).toBe('torture')
    expect(res.body.result.capabilities.tools).toBeDefined()
  })

  it('with violation T-07 enabled, foreign Origin still returns 200', async () => {
    const app = createTortureApp({ violations: new Set(['T-07']) })
    const res = await request(app)
      .post('/mcp')
      .set('content-type', 'application/json')
      .set('mcp-protocol-version', '2025-11-25')
      .set('origin', 'https://evil.example.com')
      .send({ jsonrpc: '2.0', id: 1, method: 'ping' })
    expect(res.status).toBe(200)
  })

  it('without violation T-07, foreign Origin returns 403', async () => {
    const app = createTortureApp({ violations: new Set() })
    const res = await request(app)
      .post('/mcp')
      .set('content-type', 'application/json')
      .set('mcp-protocol-version', '2025-11-25')
      .set('origin', 'https://evil.example.com')
      .send({ jsonrpc: '2.0', id: 1, method: 'ping' })
    expect(res.status).toBe(403)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd torture-server && pnpm test`
Expected: FAIL — `createTortureApp` not found.

- [ ] **Step 3: Write `torture-server/src/violations.ts`**

```typescript
// torture-server/src/violations.ts
export type ViolationId =
  | 'T-01' | 'T-03' | 'T-05' | 'T-07' | 'T-12' | 'T-13'
  | 'J-01' | 'J-02' | 'J-03' | 'J-04' | 'J-05' | 'J-06' | 'J-07' | 'J-08' | 'J-09'
  | 'L-01' | 'L-02' | 'L-04' | 'L-06' | 'L-09'
  | 'C-01' | 'C-02' | 'C-03' | 'C-04' | 'C-05' | 'C-06'
  | 'TL-01' | 'TL-02' | 'TL-05' | 'TL-08' | 'TL-09'
  | 'R-01' | 'R-04' | 'R-07'
  | 'P-01' | 'P-04'
  | 'SMP-01' | 'SMP-02'
  | 'EL-01' | 'EL-02'
  | 'U-01' | 'U-04' | 'U-08'
  | 'AUTH-01' | 'AUTH-02' | 'AUTH-03' | 'AUTH-10'
  | 'S-01' | 'S-04'
  | 'TK-01' | 'TK-02'
  | 'H-01' | 'H-02' | 'H-08'
  | 'RC-01' | 'RC-02' | 'RC-03'
  | 'DISC-01' | 'DISC-02'
  | 'SL-01' | 'SL-02'
  | 'SUB-01' | 'SUB-02'
  | 'CACHE-01' | 'CACHE-05'
  | 'MRTR-01' | 'MRTR-03'

export interface ViolationConfig {
  violations: Set<ViolationId>
}

export function has(cfg: ViolationConfig, id: ViolationId): boolean {
  return cfg.violations.has(id)
}
```

- [ ] **Step 4: Write `torture-server/src/index.ts`**

```typescript
// torture-server/src/index.ts
import express, { type Express, type Request, type Response } from 'express'
import { has, type ViolationConfig } from './violations.js'

const ALLOWED_ORIGINS = new Set(['http://localhost:3000', 'http://127.0.0.1:3000'])

function validOrigin(req: Request, cfg: ViolationConfig): boolean {
  const origin = req.header('origin')
  if (!origin) return true
  if (has(cfg, 'T-07')) return true // intentionally lax
  return ALLOWED_ORIGINS.has(origin)
}

function validProtoHeader(req: Request, cfg: ViolationConfig): boolean {
  if (has(cfg, 'T-13')) return true
  const v = req.header('mcp-protocol-version')
  if (!v) return true
  return v === '2025-11-25' || v === 'DRAFT-2026-v1'
}

function jsonRpcResult(id: unknown, result: unknown): Record<string, unknown> {
  return { jsonrpc: '2.0', id, result }
}

function jsonRpcError(id: unknown, code: number, message: string): Record<string, unknown> {
  return { jsonrpc: '2.0', id, error: { code, message } }
}

export function createTortureApp(cfg: ViolationConfig): Express {
  const app = express()
  app.use(express.json({ limit: '4mb' }))

  app.post('/mcp', (req: Request, res: Response) => {
    if (!validOrigin(req, cfg)) {
      res.status(403).send('Origin not allowed')
      return
    }
    if (!validProtoHeader(req, cfg)) {
      res.status(400).send('Bad MCP-Protocol-Version')
      return
    }
    if (has(cfg, 'T-01') && req.header('content-type') !== 'application/vnd.acme+json') {
      // Pretend the server only accepts a fake content type.
      res.status(415).send('Unsupported Media Type')
      return
    }
    const body = req.body as { id?: unknown; method?: unknown; params?: unknown }
    if (body.method === undefined && body.id === undefined) {
      res.status(400).json(jsonRpcError(null, -32700, 'Parse error'))
      return
    }
    if (body.id === undefined) {
      if (has(cfg, 'T-05')) {
        res.status(200).send('')
        return
      }
      res.status(202).send('')
      return
    }
    if (has(cfg, 'T-03')) {
      res.status(200).type('text/plain').send(JSON.stringify(jsonRpcResult(body.id, {})))
      return
    }
    if (!has(cfg, 'T-12') && !req.header('mcp-protocol-version') && body.method !== 'initialize') {
      res.status(400).send('Missing MCP-Protocol-Version header')
      return
    }
    handleRequest(req, res, body, cfg)
  })

  app.put('/mcp', (_req, res) => res.status(405).send('Method Not Allowed'))
  app.patch('/mcp', (_req, res) => res.status(405).send('Method Not Allowed'))

  return app
}

function handleRequest(req: Request, res: Response, body: { id?: unknown; method?: unknown; params?: unknown }, cfg: ViolationConfig): void {
  const { id, method, params } = body
  switch (method) {
    case 'initialize': {
      const result = {
        protocolVersion: has(cfg, 'L-04') ? '0000-00-00' : '2025-11-25',
        capabilities: has(cfg, 'C-01') ? {} : { tools: {}, resources: {}, prompts: {} },
        serverInfo: has(cfg, 'L-02') ? { name: 42 as unknown as string, version: 7 as unknown as string } : { name: 'torture', version: '0.0.1' },
      }
      if (has(cfg, 'J-01')) {
        res.status(200).json({ id, result })
      } else {
        res.status(200).json(jsonRpcResult(id, result))
      }
      return
    }
    case 'ping':
      res.status(200).json(jsonRpcResult(id, {}))
      return
    case 'tools/list':
      if (has(cfg, 'TL-01')) { res.status(200).json(jsonRpcResult(id, { tools: [{ name: 'incomplete' }] })); return }
      if (has(cfg, 'TL-05')) { res.status(200).json(jsonRpcResult(id, { tools: [{ name: 'dup', description: 'd', inputSchema: { type: 'object' } }, { name: 'dup', description: 'd', inputSchema: { type: 'object' } }] })); return }
      res.status(200).json(jsonRpcResult(id, { tools: [{ name: 'echo', description: 'echoes its input', inputSchema: { type: 'object', properties: { msg: { type: 'string' } }, required: ['msg'] } }] }))
      return
    case 'tools/call': {
      const name = (params as { name?: unknown } | undefined)?.name
      if (typeof name !== 'string') {
        res.status(200).json(jsonRpcError(id, -32602, 'missing name'))
        return
      }
      if (name === 'echo') {
        const arguments_ = (params as { arguments?: Record<string, unknown> }).arguments
        if (!arguments_ || typeof arguments_.msg !== 'string') {
          if (has(cfg, 'TL-09')) {
            res.status(200).json(jsonRpcError(id, -32602, 'bad input'))
          } else {
            res.status(200).json(jsonRpcResult(id, { content: [{ type: 'text', text: 'oops' }], isError: true }))
          }
          return
        }
        res.status(200).json(jsonRpcResult(id, { content: [{ type: 'text', text: arguments_.msg }] }))
        return
      }
      if (has(cfg, 'TL-08')) {
        res.status(200).json(jsonRpcResult(id, { content: [{ type: 'text', text: 'fake success' }] }))
        return
      }
      res.status(200).json(jsonRpcError(id, -32601, `Unknown tool: ${name}`))
      return
    }
    case 'resources/list':
      if (has(cfg, 'R-01')) { res.status(200).json(jsonRpcResult(id, { resources: [{ uri: 'file://x' }] })); return }
      res.status(200).json(jsonRpcResult(id, { resources: [{ uri: 'file:///readme.md', name: 'readme', mimeType: 'text/plain' }] }))
      return
    case 'resources/read':
      if (has(cfg, 'R-04')) { res.status(200).json(jsonRpcResult(id, { contents: [{}] })); return }
      if (has(cfg, 'R-07')) { res.status(200).json(jsonRpcResult(id, { contents: [{ uri: 'file:///r.md', text: 'hi', blob: 'aGk=' }] })); return }
      res.status(200).json(jsonRpcResult(id, { contents: [{ uri: 'file:///readme.md', text: 'hello' }] }))
      return
    case 'prompts/list':
      if (has(cfg, 'P-01')) { res.status(200).json(jsonRpcResult(id, { prompts: [{}] })); return }
      res.status(200).json(jsonRpcResult(id, { prompts: [{ name: 'greet' }] }))
      return
    case 'prompts/get':
      if (has(cfg, 'P-04')) { res.status(200).json(jsonRpcResult(id, { messages: [{ role: 'wizard', content: { type: 'text', text: 'meh' } }] })); return }
      res.status(200).json(jsonRpcResult(id, { messages: [{ role: 'user', content: { type: 'text', text: 'hi' } }] }))
      return
    default:
      if (has(cfg, 'J-04')) {
        res.status(200).json(jsonRpcError(id, -99999, 'wrong code'))
        return
      }
      res.status(200).json(jsonRpcError(id, -32601, 'Method not found'))
      return
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const bad = new Set<string>(process.argv.slice(2).filter((a) => !a.startsWith('--')))
  const app = createTortureApp({ violations: bad as never })
  const port = Number(process.env.PORT ?? '3845')
  app.listen(port, '127.0.0.1', () => {
    // eslint-disable-next-line no-console
    console.log(`torture-server on http://127.0.0.1:${port}/mcp (violations=${[...bad].join(',')})`)
  })
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd torture-server && pnpm test`
Expected: PASS — 3 tests pass.

- [ ] **Step 6: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add torture-server/src/index.ts torture-server/src/violations.ts torture-server/tests/smoke.test.ts && git commit -m "feat(torture-server): broken MCP server with per-violation toggle flags"
```

---

## Group H — Check Catalog (60 checks across all 19 categories)

### Check Authoring Pattern

Every check is one folder under `argus/lib/conformance/checks/<category>/<ID>.<slug>/` containing `check.ts` (default-exports the `Check`) and `check.test.ts` (boots torture-server, invokes the check, asserts on the result).

Each per-category task in this group ships every check in that category. To keep tasks bite-sized but each one complete, the per-category task lists every check's identifying metadata once, every `run()` body in full, and a single combined unit test file that boots torture-server with the relevant violations toggled.

The test boilerplate is identical across categories; each task copies it verbatim with only the violation set changing. The pattern is:

```typescript
// argus/tests/unit/conformance/checks/<category>.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../../torture-server/src/index'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'

async function start(violations: string[]): Promise<{ url: string; close: () => Promise<void> }> {
  const app = createTortureApp({ violations: new Set(violations) as never })
  const server: Server = app.listen(0)
  await new Promise<void>((r) => server.once('listening', () => r()))
  const { port } = server.address() as AddressInfo
  const url = `http://127.0.0.1:${port}/mcp`
  return { url, close: () => new Promise<void>((r) => server.close(() => r())) }
}

async function makeCtx(url: string): Promise<CheckContext> {
  const transport = createHttpTransport({ kind: 'http', url, protocolVersion: '2025-11-25' })
  const rawHttp = createRawHttpClient({ url })
  const client = createMcpClient(transport, '2025-11-25', url)
  const init = await client.initialize()
  await client.notifyInitialized()
  return {
    client, rawHttp, transport,
    spec: '2025-11-25',
    serverInfo: init,
    capabilities: init.capabilities,
    log: () => undefined,
  }
}
```

Each per-category task uses the boilerplate above (the `make` test fixture and `import`s are duplicated in each test file to keep tasks independently dispatchable to subagents).

When a check folder `<ID>.<slug>/` is added, the task's last step appends one import + one `registerChecks(...)` call to `argus/lib/conformance/registry.ts`. The placeholder check added in Task 11 stays until Task 23 runs; Task 23 removes it.

---

### Task 23: Transport checks (T-01, T-03, T-05, T-07, T-12, T-13)

**Files (six check folders, one combined test file, registry edit):**

- Create: `argus/lib/conformance/checks/transport/T-01.content-type-json/check.ts`
- Create: `argus/lib/conformance/checks/transport/T-03.response-content-type/check.ts`
- Create: `argus/lib/conformance/checks/transport/T-05.notification-202/check.ts`
- Create: `argus/lib/conformance/checks/transport/T-07.origin-validation/check.ts`
- Create: `argus/lib/conformance/checks/transport/T-12.protocol-version-header/check.ts`
- Create: `argus/lib/conformance/checks/transport/T-13.protocol-version-rejected/check.ts`
- Create: `argus/tests/unit/conformance/checks/transport.test.ts`
- Modify: `argus/lib/conformance/registry.ts` (remove placeholder, import + register all six)

- [ ] **Step 1: Write the failing combined test**

```typescript
// argus/tests/unit/conformance/checks/transport.test.ts
import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../../torture-server/src/index'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import T01 from '@/lib/conformance/checks/transport/T-01.content-type-json/check'
import T03 from '@/lib/conformance/checks/transport/T-03.response-content-type/check'
import T05 from '@/lib/conformance/checks/transport/T-05.notification-202/check'
import T07 from '@/lib/conformance/checks/transport/T-07.origin-validation/check'
import T12 from '@/lib/conformance/checks/transport/T-12.protocol-version-header/check'
import T13 from '@/lib/conformance/checks/transport/T-13.protocol-version-rejected/check'

async function start(violations: string[]): Promise<{ url: string; close: () => Promise<void> }> {
  const app = createTortureApp({ violations: new Set(violations) as never })
  const server: Server = app.listen(0)
  await new Promise<void>((r) => server.once('listening', () => r()))
  const { port } = server.address() as AddressInfo
  const url = `http://127.0.0.1:${port}/mcp`
  return { url, close: () => new Promise<void>((r) => server.close(() => r())) }
}

async function makeCtx(url: string): Promise<CheckContext> {
  const transport = createHttpTransport({ kind: 'http', url, protocolVersion: '2025-11-25' })
  const rawHttp = createRawHttpClient({ url })
  const client = createMcpClient(transport, '2025-11-25', url)
  const init = await client.initialize()
  return {
    client, rawHttp, transport,
    spec: '2025-11-25', serverInfo: init,
    capabilities: init.capabilities, log: () => undefined,
  }
}

describe('transport checks', () => {
  it('T-01 passes when server accepts application/json', async () => {
    const s = await start([])
    const r = await T01.run(await makeCtx(s.url))
    expect(r.status).toBe('pass')
    await s.close()
  })

  it('T-01 fails when server returns 415 to application/json', async () => {
    const s = await start(['T-01'])
    const r = await T01.run(await makeCtx(s.url)).catch(async () => {
      const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
      return T01.run(ctx)
    })
    expect(r.status).toBe('fail')
    await s.close()
  })

  it('T-03 passes for application/json responses', async () => {
    const s = await start([])
    const r = await T03.run(await makeCtx(s.url))
    expect(r.status).toBe('pass')
    await s.close()
  })

  it('T-03 fails when content-type is text/plain', async () => {
    const s = await start(['T-03'])
    // T-03 inspects content-type directly, no initialize required
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await T03.run(ctx)
    expect(r.status).toBe('fail')
    await s.close()
  })

  it('T-05 passes when notification returns 202', async () => {
    const s = await start([])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await T05.run(ctx)
    expect(r.status).toBe('pass')
    await s.close()
  })

  it('T-05 fails when notification returns 200', async () => {
    const s = await start(['T-05'])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await T05.run(ctx)
    expect(r.status).toBe('fail')
    await s.close()
  })

  it('T-07 passes when foreign Origin is 403', async () => {
    const s = await start([])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25', client: { url: s.url } } as unknown as CheckContext
    const r = await T07.run(ctx)
    expect(r.status).toBe('pass')
    await s.close()
  })

  it('T-07 fails when foreign Origin is accepted', async () => {
    const s = await start(['T-07'])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25', client: { url: s.url } } as unknown as CheckContext
    const r = await T07.run(ctx)
    expect(r.status).toBe('fail')
    await s.close()
  })

  it('T-12 passes when MCP-Protocol-Version header is required', async () => {
    const s = await start([])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await T12.run(ctx)
    expect(r.status).toBe('pass')
    await s.close()
  })

  it('T-13 passes when bad MCP-Protocol-Version is rejected', async () => {
    const s = await start([])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await T13.run(ctx)
    expect(r.status).toBe('pass')
    await s.close()
  })

  it('T-13 fails when bogus MCP-Protocol-Version is accepted', async () => {
    const s = await start(['T-13'])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await T13.run(ctx)
    expect(r.status).toBe('fail')
    await s.close()
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd argus && pnpm test tests/unit/conformance/checks/transport.test.ts -- --run`
Expected: FAIL — check modules not found.

- [ ] **Step 3: Write `T-01.content-type-json/check.ts`**

```typescript
// argus/lib/conformance/checks/transport/T-01.content-type-json/check.ts
import type { Check } from '@/lib/conformance/types'
import { renderCurl } from '@/lib/conformance/helpers/curl'

const check: Check = {
  id: 'T-01',
  category: 'transport',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['2025-11-25', 'DRAFT-2026-v1'],
  deterministic: true,
  title: 'Server accepts application/json POST bodies',
  probe: 'POST a JSON-RPC ping with Content-Type: application/json',
  criterion: 'Server returns 200/202/SSE — never 415',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: '§ Streamable HTTP',
    quote: 'The server MUST accept POST requests with Content-Type: application/json.',
  },
  async run(ctx) {
    const start = performance.now()
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' })
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'MCP-Protocol-Version': ctx.spec,
    }
    const res = await ctx.rawHttp.fetch({ method: 'POST', headers, body })
    const durationMs = performance.now() - start
    const evidence = {
      request: { method: 'POST', url: ctx.rawHttp.url, headers, body: JSON.parse(body) },
      response: { status: res.status, headers: res.headers, body: await res.text() },
      expected: 'status in {200, 202}',
      actual: res.status,
      curlCommand: renderCurl({ method: 'POST', url: ctx.rawHttp.url, headers, body }),
    }
    if (res.status === 415) {
      return { checkId: 'T-01', status: 'fail', message: 'Server returned 415 to application/json; spec REQUIRES it accept application/json.', durationMs, evidence }
    }
    if (res.status === 200 || res.status === 202) {
      return { checkId: 'T-01', status: 'pass', durationMs, evidence }
    }
    return { checkId: 'T-01', status: 'fail', message: `Expected 200/202, got ${res.status}.`, durationMs, evidence }
  },
}

export default check
```

- [ ] **Step 4: Write `T-03.response-content-type/check.ts`**

```typescript
// argus/lib/conformance/checks/transport/T-03.response-content-type/check.ts
import type { Check } from '@/lib/conformance/types'
import { renderCurl } from '@/lib/conformance/helpers/curl'

const check: Check = {
  id: 'T-03',
  category: 'transport',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['2025-11-25', 'DRAFT-2026-v1'],
  deterministic: true,
  title: 'Response Content-Type is application/json or text/event-stream',
  probe: 'POST a JSON-RPC ping; inspect response Content-Type',
  criterion: 'Content-Type is exactly application/json OR text/event-stream',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: '§ Streamable HTTP',
    quote: 'Response Content-Type MUST be one of application/json or text/event-stream.',
  },
  async run(ctx) {
    const start = performance.now()
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' })
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'MCP-Protocol-Version': ctx.spec,
    }
    const res = await ctx.rawHttp.fetch({ method: 'POST', headers, body })
    const ct = (res.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()
    const durationMs = performance.now() - start
    const evidence = {
      response: { status: res.status, headers: res.headers, body: await res.text() },
      expected: 'application/json or text/event-stream',
      actual: ct,
      curlCommand: renderCurl({ method: 'POST', url: ctx.rawHttp.url, headers, body }),
    }
    if (ct === 'application/json' || ct === 'text/event-stream') {
      return { checkId: 'T-03', status: 'pass', durationMs, evidence }
    }
    return { checkId: 'T-03', status: 'fail', message: `Unexpected Content-Type: ${ct}`, durationMs, evidence }
  },
}

export default check
```

- [ ] **Step 5: Write `T-05.notification-202/check.ts`**

```typescript
// argus/lib/conformance/checks/transport/T-05.notification-202/check.ts
import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'T-05',
  category: 'transport',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['2025-11-25', 'DRAFT-2026-v1'],
  deterministic: true,
  title: 'Notification (no id) returns 202 Accepted with empty body',
  probe: 'POST a JSON-RPC notification without an id field',
  criterion: 'Status is 202 and body is empty',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: '§ Streamable HTTP — Notifications',
    quote: 'For notifications, the server MUST respond with HTTP 202 Accepted and an empty body.',
  },
  async run(ctx) {
    const start = performance.now()
    const body = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'MCP-Protocol-Version': ctx.spec,
    }
    const res = await ctx.rawHttp.fetch({ method: 'POST', headers, body })
    const text = await res.text()
    const durationMs = performance.now() - start
    const evidence = {
      response: { status: res.status, headers: res.headers, body: text },
      expected: { status: 202, body: '' },
      actual: { status: res.status, body: text },
    }
    if (res.status === 202 && text === '') {
      return { checkId: 'T-05', status: 'pass', durationMs, evidence }
    }
    return { checkId: 'T-05', status: 'fail', message: `Expected 202+empty, got ${res.status}+${text.length}B`, durationMs, evidence }
  },
}

export default check
```

- [ ] **Step 6: Write `T-07.origin-validation/check.ts`**

```typescript
// argus/lib/conformance/checks/transport/T-07.origin-validation/check.ts
import type { Check } from '@/lib/conformance/types'
import { renderCurl } from '@/lib/conformance/helpers/curl'

const check: Check = {
  id: 'T-07',
  category: 'transport',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['2025-11-25', 'DRAFT-2026-v1'],
  deterministic: true,
  title: 'Server validates Origin header (DNS-rebinding protection)',
  probe: 'POST /mcp with Origin: https://evil.example.com',
  criterion: 'Server returns HTTP 403 Forbidden',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#security-warning',
    section: '§ Security Warning',
    quote: 'Servers MUST validate the Origin header on all incoming connections to prevent DNS rebinding attacks. If the Origin header is present and invalid, servers MUST respond with HTTP 403 Forbidden.',
  },
  async run(ctx) {
    const start = performance.now()
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Origin': 'https://evil.example.com',
      'MCP-Protocol-Version': ctx.spec,
    }
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' })
    const res = await ctx.rawHttp.fetch({ method: 'POST', headers, body })
    const durationMs = performance.now() - start
    const evidence = {
      request: { method: 'POST', url: ctx.rawHttp.url, headers, body: JSON.parse(body) },
      response: { status: res.status, headers: res.headers, body: await res.text() },
      expected: 403,
      actual: res.status,
      curlCommand: renderCurl({ method: 'POST', url: ctx.rawHttp.url, headers, body }),
    }
    if (res.status === 403) {
      return { checkId: 'T-07', status: 'pass', durationMs, evidence }
    }
    return {
      checkId: 'T-07', status: 'fail',
      message: `Expected 403 for bogus Origin, got ${res.status}. Server is vulnerable to DNS rebinding attacks.`,
      durationMs, evidence,
    }
  },
}

export default check
```

- [ ] **Step 7: Write `T-12.protocol-version-header/check.ts`**

```typescript
// argus/lib/conformance/checks/transport/T-12.protocol-version-header/check.ts
import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'T-12',
  category: 'transport',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['2025-11-25'],
  deterministic: true,
  title: 'Server requires MCP-Protocol-Version on post-initialize requests',
  probe: 'POST a ping without the MCP-Protocol-Version header',
  criterion: 'Server returns HTTP 400 Bad Request',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: '§ Headers',
    quote: 'After initialization, clients MUST include the MCP-Protocol-Version header on all requests. Servers MUST reject requests missing this header with HTTP 400.',
  },
  async run(ctx) {
    const start = performance.now()
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
    }
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' })
    const res = await ctx.rawHttp.fetch({ method: 'POST', headers, body })
    const durationMs = performance.now() - start
    const evidence = {
      response: { status: res.status, headers: res.headers, body: await res.text() },
      expected: 400, actual: res.status,
    }
    if (res.status === 400) {
      return { checkId: 'T-12', status: 'pass', durationMs, evidence }
    }
    return { checkId: 'T-12', status: 'fail', message: `Expected 400 for missing MCP-Protocol-Version, got ${res.status}.`, durationMs, evidence }
  },
}

export default check
```

- [ ] **Step 8: Write `T-13.protocol-version-rejected/check.ts`**

```typescript
// argus/lib/conformance/checks/transport/T-13.protocol-version-rejected/check.ts
import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'T-13',
  category: 'transport',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['2025-11-25', 'DRAFT-2026-v1'],
  deterministic: true,
  title: 'Server rejects bogus MCP-Protocol-Version',
  probe: 'POST a ping with MCP-Protocol-Version: 9999-99-99',
  criterion: 'Server returns HTTP 400 Bad Request',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: '§ Headers',
    quote: 'Servers MUST reject requests with unrecognized MCP-Protocol-Version with HTTP 400.',
  },
  async run(ctx) {
    const start = performance.now()
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'MCP-Protocol-Version': '9999-99-99',
    }
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' })
    const res = await ctx.rawHttp.fetch({ method: 'POST', headers, body })
    const durationMs = performance.now() - start
    const evidence = {
      response: { status: res.status, headers: res.headers, body: await res.text() },
      expected: 400, actual: res.status,
    }
    if (res.status === 400) {
      return { checkId: 'T-13', status: 'pass', durationMs, evidence }
    }
    return { checkId: 'T-13', status: 'fail', message: `Expected 400 for bogus protocol version, got ${res.status}.`, durationMs, evidence }
  },
}

export default check
```

- [ ] **Step 9: Remove the placeholder + register all six checks**

Edit `argus/lib/conformance/registry.ts`:

```typescript
// argus/lib/conformance/registry.ts
import type { Check, Category } from './types'
import T01 from './checks/transport/T-01.content-type-json/check'
import T03 from './checks/transport/T-03.response-content-type/check'
import T05 from './checks/transport/T-05.notification-202/check'
import T07 from './checks/transport/T-07.origin-validation/check'
import T12 from './checks/transport/T-12.protocol-version-header/check'
import T13 from './checks/transport/T-13.protocol-version-rejected/check'

const _checks: Check[] = []

export function registerChecks(...checks: Check[]): void {
  for (const c of checks) {
    if (_checks.find((x) => x.id === c.id)) throw new Error(`duplicate check id: ${c.id}`)
    _checks.push(c)
  }
}

export function listChecks(): readonly Check[] { return _checks }
export function getCheck(id: string): Check | undefined { return _checks.find((c) => c.id === id) }

export function byCategory(): Record<Category, Check[]> {
  const cats = [
    'transport', 'jsonrpc', 'lifecycle', 'capabilities',
    'tools', 'resources', 'prompts',
    'sampling', 'elicitation', 'utilities',
    'authorization', 'security', 'tasks', 'hygiene',
    'rc', 'discovery', 'stateless', 'subscriptions', 'caching', 'mrtr',
  ] as const
  const out = Object.fromEntries(cats.map((c) => [c, [] as Check[]])) as Record<Category, Check[]>
  for (const c of _checks) out[c.category].push(c)
  return out
}

registerChecks(T01, T03, T05, T07, T12, T13)
```

- [ ] **Step 10: Run tests to verify all pass**

Run: `cd argus && pnpm test tests/unit/conformance/checks/transport.test.ts -- --run`
Expected: PASS — 11 tests pass.

Run also: `cd argus && pnpm test tests/unit/conformance/registry.test.ts -- --run`
Expected: PASS — registry test still passes (now with 6 real checks instead of 1 placeholder).

- [ ] **Step 11: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/transport argus/tests/unit/conformance/checks/transport.test.ts argus/lib/conformance/registry.ts && git commit -m "feat(argus): add Transport checks T-01, T-03, T-05, T-07, T-12, T-13"
```

---

### Authoring shorthand for remaining categories

The remaining 18 category tasks (Tasks 24–41) follow Task 23's pattern exactly. Each task:

1. Creates `argus/lib/conformance/checks/<category>/<ID>.<slug>/check.ts` per check in the list.
2. Adds `argus/tests/unit/conformance/checks/<category>.test.ts` with one pass-case and one fail-case per check.
3. Appends imports + a single `registerChecks(...)` line to `argus/lib/conformance/registry.ts`.
4. Runs all check tests + registry test green.
5. Commits with message `feat(argus): add <Category> checks <IDs>`.

To keep each task self-contained, every check listed below specifies: `id`, `category`, `severity`, `confidence`, `appliesTo`, `title`, `probe`, `criterion`, `specRef`, `requires` (if applicable), and the full `run()` body.

---

### Task 24: JSON-RPC checks

**Files:**
- Create: `argus/lib/conformance/checks/jsonrpc/J-01.jsonrpc-version/check.ts`
- Create: `argus/lib/conformance/checks/jsonrpc/J-02.id-echoed/check.ts`
- Create: `argus/lib/conformance/checks/jsonrpc/J-03.result-xor-error/check.ts`
- Create: `argus/lib/conformance/checks/jsonrpc/J-04.unknown-method/check.ts`
- Create: `argus/lib/conformance/checks/jsonrpc/J-05.parse-error/check.ts`
- Create: `argus/lib/conformance/checks/jsonrpc/J-06.invalid-params/check.ts`
- Create: `argus/lib/conformance/checks/jsonrpc/J-07.notification-no-response/check.ts`
- Create: `argus/lib/conformance/checks/jsonrpc/J-08.error-shape/check.ts`
- Create: `argus/lib/conformance/checks/jsonrpc/J-09.internal-error-code/check.ts`
- Test: `argus/tests/unit/conformance/checks/jsonrpc.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

- [ ] **Step 1: Write failing combined test**

```ts
// argus/tests/unit/conformance/checks/jsonrpc.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTortureApp, type ViolationToggles } from '../../../../../torture-server/src/index'
import { createMcpClient } from '@/lib/conformance/client'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import J01 from '@/lib/conformance/checks/jsonrpc/J-01.jsonrpc-version/check'
import J02 from '@/lib/conformance/checks/jsonrpc/J-02.id-echoed/check'
import J03 from '@/lib/conformance/checks/jsonrpc/J-03.result-xor-error/check'
import J04 from '@/lib/conformance/checks/jsonrpc/J-04.unknown-method/check'
import J05 from '@/lib/conformance/checks/jsonrpc/J-05.parse-error/check'
import J06 from '@/lib/conformance/checks/jsonrpc/J-06.invalid-params/check'
import J07 from '@/lib/conformance/checks/jsonrpc/J-07.notification-no-response/check'
import J08 from '@/lib/conformance/checks/jsonrpc/J-08.error-shape/check'
import J09 from '@/lib/conformance/checks/jsonrpc/J-09.internal-error-code/check'
import type { CheckContext } from '@/lib/conformance/types'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'

let server: Server
let port: number
let toggles: ViolationToggles

beforeAll(async () => {
  toggles = {}
  const app = createTortureApp({ violations: toggles })
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve())
  })
  port = (server.address() as AddressInfo).port
})

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()))
})

function ctx(): CheckContext {
  const url = `http://127.0.0.1:${port}/mcp`
  const rawHttp = createRawHttpClient({ url })
  const transport = createHttpTransport({ url, spec: 'DRAFT-2026-v1', rawHttp })
  const client = createMcpClient(transport, 'DRAFT-2026-v1', url)
  return {
    client,
    rawHttp,
    transport: { kind: 'http', url },
    spec: 'DRAFT-2026-v1',
    serverInfo: { name: 'torture', version: '0.0.1' },
    capabilities: { tools: {}, resources: {}, prompts: {} },
    log: () => {},
  }
}

describe('JSON-RPC checks — pass cases', () => {
  it.each([J01, J02, J03, J04, J06, J07, J08])('%s passes', async (chk) => {
    Object.keys(toggles).forEach((k) => delete (toggles as any)[k])
    const result = await chk.run(ctx())
    expect(result.status).toBe('pass')
  })

  it('J-05 passes (parse error returns -32700)', async () => {
    Object.keys(toggles).forEach((k) => delete (toggles as any)[k])
    const result = await J05.run(ctx())
    expect(result.status).toBe('pass')
  })

  it('J-09 passes (internal error returns -32603)', async () => {
    Object.keys(toggles).forEach((k) => delete (toggles as any)[k])
    const result = await J09.run(ctx())
    expect(result.status).toBe('pass')
  })
})

describe('JSON-RPC checks — fail cases', () => {
  it('J-01 fails when jsonrpc field omitted', async () => {
    Object.keys(toggles).forEach((k) => delete (toggles as any)[k])
    toggles['J-01'] = true
    const result = await J01.run(ctx())
    expect(result.status).toBe('fail')
  })

  it('J-04 fails when wrong error code returned', async () => {
    Object.keys(toggles).forEach((k) => delete (toggles as any)[k])
    toggles['J-04'] = true
    const result = await J04.run(ctx())
    expect(result.status).toBe('fail')
  })
})
```

- [ ] **Step 2: Run test, expect fail**

Run: `cd argus && pnpm test tests/unit/conformance/checks/jsonrpc.test.ts -- --run`
Expected: FAIL — check modules do not exist yet.

- [ ] **Step 3: Implement J-01 jsonrpc-version**

```ts
// argus/lib/conformance/checks/jsonrpc/J-01.jsonrpc-version/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'J-01',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Every response contains "jsonrpc": "2.0"',
  probe: 'Send any valid request and inspect the JSON-RPC envelope.',
  criterion: 'Response object MUST include `jsonrpc: "2.0"`.',
  specRef: {
    url: 'https://www.jsonrpc.org/specification',
    section: '5 Response object',
    quote: 'jsonrpc — A String specifying the version of the JSON-RPC protocol. MUST be exactly "2.0".',
  },
  deterministic: true,
  async run(ctx) {
    const { result, raw } = await ctx.client.call('ping', {})
    const hasField = (raw as any)?.jsonrpc === '2.0'
    if (hasField) {
      return {
        checkId: 'J-01',
        status: 'pass',
        durationMs: 0,
        evidence: { actual: 'jsonrpc: "2.0" present', response: raw },
      }
    }
    return {
      checkId: 'J-01',
      status: 'fail',
      durationMs: 0,
      message: 'Response missing required `jsonrpc: "2.0"` field.',
      evidence: { expected: '{ "jsonrpc": "2.0", ... }', actual: raw, response: raw },
    }
  },
}

export default check
```

- [ ] **Step 4: Implement J-02 id-echoed**

```ts
// argus/lib/conformance/checks/jsonrpc/J-02.id-echoed/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'J-02',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Response id echoes request id (no type coercion)',
  probe: 'Send request with id: "abc" (string) and verify response id is the same string.',
  criterion: 'Response `id` MUST equal request `id` byte-for-byte; numbers stay numbers, strings stay strings.',
  specRef: {
    url: 'https://www.jsonrpc.org/specification',
    section: '5 Response object',
    quote: 'id — This member is REQUIRED. It MUST be the same as the value of the id member in the Request Object.',
  },
  deterministic: true,
  async run(ctx) {
    const req = { jsonrpc: '2.0' as const, id: 'abc-xyz', method: 'ping', params: {} }
    const raw = await ctx.rawHttp(req)
    const echoed = (raw as any)?.id === 'abc-xyz'
    if (echoed) {
      return { checkId: 'J-02', status: 'pass', durationMs: 0, evidence: { request: req, response: raw } }
    }
    return {
      checkId: 'J-02',
      status: 'fail',
      durationMs: 0,
      message: `Response id does not match request id. Expected "abc-xyz", got ${JSON.stringify((raw as any)?.id)}.`,
      evidence: { request: req, response: raw, expected: 'abc-xyz', actual: (raw as any)?.id },
    }
  },
}

export default check
```

- [ ] **Step 5: Implement J-03 result-xor-error**

```ts
// argus/lib/conformance/checks/jsonrpc/J-03.result-xor-error/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'J-03',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Response contains exactly one of result or error',
  probe: 'Inspect any response — it must contain `result` XOR `error`, never both, never neither.',
  criterion: 'Response object has `result` or `error` but never both.',
  specRef: {
    url: 'https://www.jsonrpc.org/specification',
    section: '5 Response object',
    quote: 'Either the result member or error member MUST be included, but both members MUST NOT be included.',
  },
  deterministic: true,
  async run(ctx) {
    const { raw } = await ctx.client.call('ping', {})
    const r = raw as any
    const hasResult = 'result' in r
    const hasError = 'error' in r
    if (hasResult !== hasError) {
      return { checkId: 'J-03', status: 'pass', durationMs: 0, evidence: { response: raw } }
    }
    return {
      checkId: 'J-03',
      status: 'fail',
      durationMs: 0,
      message: hasResult && hasError
        ? 'Response contains both `result` and `error`.'
        : 'Response contains neither `result` nor `error`.',
      evidence: { response: raw, expected: 'exactly one of result|error', actual: { hasResult, hasError } },
    }
  },
}

export default check
```

- [ ] **Step 6: Implement J-04 unknown-method**

```ts
// argus/lib/conformance/checks/jsonrpc/J-04.unknown-method/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'J-04',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Unknown method returns error code -32601',
  probe: 'Call a method that does not exist; expect MethodNotFound error.',
  criterion: 'Server MUST return JSON-RPC error code -32601 for unknown methods.',
  specRef: {
    url: 'https://www.jsonrpc.org/specification',
    section: '5.1 Error object',
    quote: '-32601 Method not found — The method does not exist / is not available.',
  },
  deterministic: true,
  async run(ctx) {
    const { error, raw } = await ctx.client.call('nonexistent/method', {})
    if (error?.code === -32601) {
      return { checkId: 'J-04', status: 'pass', durationMs: 0, evidence: { response: raw, actual: error.code } }
    }
    return {
      checkId: 'J-04',
      status: 'fail',
      durationMs: 0,
      message: `Expected error code -32601, got ${error?.code ?? '(no error)'}.`,
      evidence: { response: raw, expected: -32601, actual: error?.code ?? null },
    }
  },
}

export default check
```

- [ ] **Step 7: Implement J-05 parse-error**

```ts
// argus/lib/conformance/checks/jsonrpc/J-05.parse-error/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'J-05',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Malformed JSON returns error code -32700',
  probe: 'POST truncated JSON body; expect ParseError.',
  criterion: 'Server MUST return JSON-RPC error code -32700 for unparseable input.',
  specRef: {
    url: 'https://www.jsonrpc.org/specification',
    section: '5.1 Error object',
    quote: '-32700 Parse error — Invalid JSON was received by the server.',
  },
  deterministic: true,
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'J-05', status: 'skip', durationMs: 0, message: 'Parse-error probe is HTTP-only.' }
    }
    const url = ctx.transport.url!
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: '{"jsonrpc":"2.0","id":1,"method":',
    })
    const text = await res.text()
    let body: any = null
    try { body = JSON.parse(text) } catch { /* leave body null */ }
    if (body?.error?.code === -32700) {
      return { checkId: 'J-05', status: 'pass', durationMs: 0, evidence: { response: body, actual: body.error.code } }
    }
    return {
      checkId: 'J-05',
      status: 'fail',
      durationMs: 0,
      message: `Expected error code -32700, got ${body?.error?.code ?? '(non-JSON-RPC response)'}.`,
      evidence: { expected: -32700, actual: body?.error?.code ?? text.slice(0, 200), response: body ?? text },
    }
  },
}

export default check
```

- [ ] **Step 8: Implement J-06 invalid-params**

```ts
// argus/lib/conformance/checks/jsonrpc/J-06.invalid-params/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'J-06',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Missing required param returns error code -32602',
  probe: 'Call tools/call with missing `name` param.',
  criterion: 'Server MUST return JSON-RPC error code -32602 for invalid params.',
  specRef: {
    url: 'https://www.jsonrpc.org/specification',
    section: '5.1 Error object',
    quote: '-32602 Invalid params — Invalid method parameter(s).',
  },
  deterministic: true,
  async run(ctx) {
    const { error, raw } = await ctx.client.call('tools/call', { arguments: {} })
    if (error?.code === -32602) {
      return { checkId: 'J-06', status: 'pass', durationMs: 0, evidence: { response: raw, actual: error.code } }
    }
    return {
      checkId: 'J-06',
      status: 'fail',
      durationMs: 0,
      message: `Expected error code -32602 for missing required param, got ${error?.code ?? '(no error)'}.`,
      evidence: { response: raw, expected: -32602, actual: error?.code ?? null },
    }
  },
}

export default check
```

- [ ] **Step 9: Implement J-07 notification-no-response**

```ts
// argus/lib/conformance/checks/jsonrpc/J-07.notification-no-response/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'J-07',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Notification (no id field) yields no response body',
  probe: 'POST a JSON-RPC object without an `id` field; expect 202 Accepted with empty body.',
  criterion: 'Server MUST NOT return a response body for notifications.',
  specRef: {
    url: 'https://www.jsonrpc.org/specification',
    section: '4.1 Notification',
    quote: 'A Notification is a Request object without an "id" member. ... The Server MUST NOT reply to a Notification.',
  },
  deterministic: true,
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'J-07', status: 'skip', durationMs: 0, message: 'HTTP-only probe.' }
    }
    const url = ctx.transport.url!
    const req = { jsonrpc: '2.0', method: 'notifications/cancelled', params: { requestId: 'x' } }
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'MCP-Protocol-Version': ctx.spec,
      },
      body: JSON.stringify(req),
    })
    const text = await res.text()
    if (res.status === 202 && text.trim() === '') {
      return {
        checkId: 'J-07',
        status: 'pass',
        durationMs: 0,
        evidence: { request: req, expected: '202 with empty body', actual: `${res.status} (${text.length} bytes)` },
      }
    }
    return {
      checkId: 'J-07',
      status: 'fail',
      durationMs: 0,
      message: `Notification produced ${res.status} with ${text.length} bytes; expected 202 empty.`,
      evidence: { request: req, expected: '202 empty', actual: { status: res.status, body: text.slice(0, 200) } },
    }
  },
}

export default check
```

- [ ] **Step 10: Implement J-08 error-shape**

```ts
// argus/lib/conformance/checks/jsonrpc/J-08.error-shape/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'J-08',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Error object has integer code and string message',
  probe: 'Force an error and verify error object types.',
  criterion: 'Error `code` MUST be integer, `message` MUST be string; `data` optional.',
  specRef: {
    url: 'https://www.jsonrpc.org/specification',
    section: '5.1 Error object',
    quote: 'code — A Number that indicates the error type. MUST be an integer. message — A String providing a short description of the error.',
  },
  deterministic: true,
  async run(ctx) {
    const { error, raw } = await ctx.client.call('nonexistent/method', {})
    if (!error) {
      return {
        checkId: 'J-08',
        status: 'fail',
        durationMs: 0,
        message: 'Expected error response but got success.',
        evidence: { response: raw },
      }
    }
    const codeOk = typeof error.code === 'number' && Number.isInteger(error.code)
    const msgOk = typeof error.message === 'string'
    if (codeOk && msgOk) {
      return { checkId: 'J-08', status: 'pass', durationMs: 0, evidence: { response: raw } }
    }
    return {
      checkId: 'J-08',
      status: 'fail',
      durationMs: 0,
      message: `Error shape invalid: code is ${typeof error.code} (${error.code}), message is ${typeof error.message}.`,
      evidence: { response: raw, expected: '{ code: integer, message: string }', actual: error },
    }
  },
}

export default check
```

- [ ] **Step 11: Implement J-09 internal-error-code**

```ts
// argus/lib/conformance/checks/jsonrpc/J-09.internal-error-code/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'J-09',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Internal server error returns -32603',
  probe: 'Invoke a server-side fault path via `__torture/internal-error`.',
  criterion: 'Server MUST return -32603 for unexpected internal failures, not arbitrary or HTTP-level codes.',
  specRef: {
    url: 'https://www.jsonrpc.org/specification',
    section: '5.1 Error object',
    quote: '-32603 Internal error — Internal JSON-RPC error.',
  },
  deterministic: true,
  async run(ctx) {
    const { error, raw } = await ctx.client.call('__torture/internal-error', {})
    if (error?.code === -32603) {
      return { checkId: 'J-09', status: 'pass', durationMs: 0, evidence: { response: raw, actual: error.code } }
    }
    return {
      checkId: 'J-09',
      status: 'fail',
      durationMs: 0,
      message: `Expected -32603 internal error, got ${error?.code ?? '(no error)'}.`,
      evidence: { response: raw, expected: -32603, actual: error?.code ?? null },
    }
  },
}

export default check
```

- [ ] **Step 12: Update registry**

Append to `argus/lib/conformance/registry.ts`:

```ts
import J01 from './checks/jsonrpc/J-01.jsonrpc-version/check'
import J02 from './checks/jsonrpc/J-02.id-echoed/check'
import J03 from './checks/jsonrpc/J-03.result-xor-error/check'
import J04 from './checks/jsonrpc/J-04.unknown-method/check'
import J05 from './checks/jsonrpc/J-05.parse-error/check'
import J06 from './checks/jsonrpc/J-06.invalid-params/check'
import J07 from './checks/jsonrpc/J-07.notification-no-response/check'
import J08 from './checks/jsonrpc/J-08.error-shape/check'
import J09 from './checks/jsonrpc/J-09.internal-error-code/check'

// ... existing registerChecks(T01, ..., T13) line stays

registerChecks(J01, J02, J03, J04, J05, J06, J07, J08, J09)
```

Also extend `torture-server/src/index.ts` to handle `__torture/internal-error` (returns `-32603`) and `tools/call` invalid-param path:

```ts
// in route handler, before generic 'tools/call' handling:
if (method === '__torture/internal-error') {
  return jsonRpcError(id, -32603, 'Internal error')
}
if (method === 'tools/call' && (!params || typeof params.name !== 'string')) {
  return jsonRpcError(id, -32602, 'Missing required param: name')
}
```

Add malformed-body short-circuit before JSON.parse:

```ts
app.post('/mcp', express.text({ type: '*/*' }), (req, res) => {
  let payload: any
  try { payload = JSON.parse(req.body) } catch {
    return res.status(200).json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } })
  }
  // ... rest of handler uses `payload` instead of `req.body`
})
```

- [ ] **Step 13: Run tests, expect pass**

Run: `cd argus && pnpm test tests/unit/conformance/checks/jsonrpc.test.ts -- --run`
Expected: PASS — all 11 cases pass.

- [ ] **Step 14: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/jsonrpc argus/tests/unit/conformance/checks/jsonrpc.test.ts argus/lib/conformance/registry.ts torture-server/src/index.ts && git commit -m "feat(argus): add JSON-RPC checks J-01..J-09"
```

---

### Task 25: Lifecycle checks

**Files:**
- Create: `argus/lib/conformance/checks/lifecycle/L-01.initialize-result/check.ts`
- Create: `argus/lib/conformance/checks/lifecycle/L-02.server-info-types/check.ts`
- Create: `argus/lib/conformance/checks/lifecycle/L-04.protocol-version-echoed/check.ts`
- Create: `argus/lib/conformance/checks/lifecycle/L-06.initialized-notification/check.ts`
- Create: `argus/lib/conformance/checks/lifecycle/L-09.ping/check.ts`
- Test: `argus/tests/unit/conformance/checks/lifecycle.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

Spec base URL: `https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle`

- [ ] **Step 1: Write failing combined test**

```ts
// argus/tests/unit/conformance/checks/lifecycle.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTortureApp, type ViolationToggles } from '../../../../../torture-server/src/index'
import { createMcpClient } from '@/lib/conformance/client'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import L01 from '@/lib/conformance/checks/lifecycle/L-01.initialize-result/check'
import L02 from '@/lib/conformance/checks/lifecycle/L-02.server-info-types/check'
import L04 from '@/lib/conformance/checks/lifecycle/L-04.protocol-version-echoed/check'
import L06 from '@/lib/conformance/checks/lifecycle/L-06.initialized-notification/check'
import L09 from '@/lib/conformance/checks/lifecycle/L-09.ping/check'
import type { CheckContext } from '@/lib/conformance/types'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'

let server: Server, port: number, toggles: ViolationToggles

beforeAll(async () => {
  toggles = {}
  const app = createTortureApp({ violations: toggles })
  await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => r()) })
  port = (server.address() as AddressInfo).port
})

afterAll(() => new Promise<void>((r) => server.close(() => r())))

function ctx(): CheckContext {
  const url = `http://127.0.0.1:${port}/mcp`
  const rawHttp = createRawHttpClient({ url })
  const transport = createHttpTransport({ url, spec: 'DRAFT-2026-v1', rawHttp })
  return {
    client: createMcpClient(transport, 'DRAFT-2026-v1', url),
    rawHttp,
    transport: { kind: 'http', url },
    spec: 'DRAFT-2026-v1',
    serverInfo: { name: 'torture', version: '0.0.1' },
    capabilities: {},
    log: () => {},
  }
}

describe('Lifecycle pass', () => {
  it.each([L01, L02, L04, L06, L09])('passes', async (chk) => {
    Object.keys(toggles).forEach((k) => delete (toggles as any)[k])
    expect((await chk.run(ctx())).status).toBe('pass')
  })
})

describe('Lifecycle fail', () => {
  it('L-02 fails when serverInfo has numeric name', async () => {
    toggles['L-02'] = true
    expect((await L02.run(ctx())).status).toBe('fail')
  })
  it('L-04 fails when protocolVersion is "0000-00-00"', async () => {
    toggles['L-04'] = true
    expect((await L04.run(ctx())).status).toBe('fail')
  })
})
```

- [ ] **Step 2: Run, expect FAIL (modules missing)**

Run: `cd argus && pnpm test tests/unit/conformance/checks/lifecycle.test.ts -- --run`

- [ ] **Step 3: Implement L-01 initialize-result**

```ts
// argus/lib/conformance/checks/lifecycle/L-01.initialize-result/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'L-01', category: 'lifecycle', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'initialize result has protocolVersion, capabilities, serverInfo',
  probe: 'Call initialize; inspect result fields.',
  criterion: 'Result MUST contain `protocolVersion`, `capabilities`, `serverInfo`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle',
    section: 'Initialization',
    quote: 'The server MUST respond with its information including its name, version, and capabilities.',
  },
  deterministic: true,
  async run(ctx) {
    const init = await ctx.client.initialize()
    const r = init as any
    const missing = ['protocolVersion', 'capabilities', 'serverInfo'].filter((k) => !(k in r))
    if (missing.length === 0) {
      return { checkId: 'L-01', status: 'pass', durationMs: 0, evidence: { response: r } }
    }
    return {
      checkId: 'L-01', status: 'fail', durationMs: 0,
      message: `initialize result missing required fields: ${missing.join(', ')}.`,
      evidence: { response: r, expected: 'protocolVersion + capabilities + serverInfo', actual: Object.keys(r) },
    }
  },
}
export default check
```

- [ ] **Step 4: Implement L-02 server-info-types**

```ts
// argus/lib/conformance/checks/lifecycle/L-02.server-info-types/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'L-02', category: 'lifecycle', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'serverInfo name and version are strings',
  probe: 'Inspect serverInfo for correct field types.',
  criterion: 'serverInfo.name and serverInfo.version MUST be strings; optional fields typed correctly.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle',
    section: 'Implementation info',
    quote: 'name and version MUST be strings; title, description, websiteUrl SHOULD be strings if present.',
  },
  deterministic: true,
  async run(ctx) {
    const init: any = await ctx.client.initialize()
    const si = init.serverInfo ?? {}
    const errs: string[] = []
    if (typeof si.name !== 'string') errs.push(`name is ${typeof si.name}`)
    if (typeof si.version !== 'string') errs.push(`version is ${typeof si.version}`)
    for (const opt of ['title', 'description', 'websiteUrl']) {
      if (opt in si && typeof si[opt] !== 'string') errs.push(`${opt} is ${typeof si[opt]}`)
    }
    if (errs.length === 0) {
      return { checkId: 'L-02', status: 'pass', durationMs: 0, evidence: { response: init } }
    }
    return {
      checkId: 'L-02', status: 'fail', durationMs: 0,
      message: `serverInfo field types invalid: ${errs.join(', ')}.`,
      evidence: { response: init, expected: 'string fields', actual: si },
    }
  },
}
export default check
```

- [ ] **Step 5: Implement L-04 protocol-version-echoed**

```ts
// argus/lib/conformance/checks/lifecycle/L-04.protocol-version-echoed/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'L-04', category: 'lifecycle', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Server echoes requested protocolVersion when supported',
  probe: 'initialize({ protocolVersion: ctx.spec }); inspect echoed value.',
  criterion: 'Server MUST echo the requested protocolVersion when it can serve that version.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle',
    section: 'Version negotiation',
    quote: 'If the server supports the requested version, it MUST respond with the same version.',
  },
  deterministic: true,
  async run(ctx) {
    const init: any = await ctx.client.initialize()
    if (init.protocolVersion === ctx.spec) {
      return { checkId: 'L-04', status: 'pass', durationMs: 0, evidence: { response: init } }
    }
    return {
      checkId: 'L-04', status: 'fail', durationMs: 0,
      message: `Expected protocolVersion "${ctx.spec}", got "${init.protocolVersion}".`,
      evidence: { response: init, expected: ctx.spec, actual: init.protocolVersion },
    }
  },
}
export default check
```

- [ ] **Step 6: Implement L-06 initialized-notification**

```ts
// argus/lib/conformance/checks/lifecycle/L-06.initialized-notification/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'L-06', category: 'lifecycle', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'After notifications/initialized, normal requests succeed',
  probe: 'initialize → send notifications/initialized → call ping → expect success.',
  criterion: 'Subsequent normal requests MUST succeed after the initialized notification.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle',
    section: 'Initialization',
    quote: 'After receiving the initialize response, the client SHOULD send an initialized notification.',
  },
  deterministic: true,
  async run(ctx) {
    await ctx.client.initialize()
    await ctx.client.notify('notifications/initialized', {})
    const { result, error } = await ctx.client.call('ping', {})
    if (error) {
      return {
        checkId: 'L-06', status: 'fail', durationMs: 0,
        message: `ping after initialized failed: ${error.code} ${error.message}`,
        evidence: { actual: error },
      }
    }
    return { checkId: 'L-06', status: 'pass', durationMs: 0, evidence: { response: result } }
  },
}
export default check
```

- [ ] **Step 7: Implement L-09 ping**

```ts
// argus/lib/conformance/checks/lifecycle/L-09.ping/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'L-09', category: 'lifecycle', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'ping succeeds both pre-init and post-init',
  probe: 'Call ping before initialize and again after; both succeed.',
  criterion: 'ping MUST work in any lifecycle state.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle',
    section: 'Utility messages',
    quote: 'ping is a utility message that can be sent at any time.',
  },
  deterministic: true,
  async run(ctx) {
    const pre = await ctx.client.call('ping', {})
    if (pre.error) {
      return {
        checkId: 'L-09', status: 'fail', durationMs: 0,
        message: `Pre-init ping failed: ${pre.error.code} ${pre.error.message}`,
        evidence: { actual: pre.error },
      }
    }
    await ctx.client.initialize()
    const post = await ctx.client.call('ping', {})
    if (post.error) {
      return {
        checkId: 'L-09', status: 'fail', durationMs: 0,
        message: `Post-init ping failed: ${post.error.code} ${post.error.message}`,
        evidence: { actual: post.error },
      }
    }
    return { checkId: 'L-09', status: 'pass', durationMs: 0, evidence: { response: { pre, post } } }
  },
}
export default check
```

- [ ] **Step 8: Update registry**

```ts
import L01 from './checks/lifecycle/L-01.initialize-result/check'
import L02 from './checks/lifecycle/L-02.server-info-types/check'
import L04 from './checks/lifecycle/L-04.protocol-version-echoed/check'
import L06 from './checks/lifecycle/L-06.initialized-notification/check'
import L09 from './checks/lifecycle/L-09.ping/check'

registerChecks(L01, L02, L04, L06, L09)
```

- [ ] **Step 9: Run tests, expect PASS**

Run: `cd argus && pnpm test tests/unit/conformance/checks/lifecycle.test.ts -- --run`

- [ ] **Step 10: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/lifecycle argus/tests/unit/conformance/checks/lifecycle.test.ts argus/lib/conformance/registry.ts && git commit -m "feat(argus): add Lifecycle checks L-01, L-02, L-04, L-06, L-09"
```

---

### Task 26: Capabilities checks

**Files:**
- Create: `argus/lib/conformance/checks/capabilities/C-01.tools-list/check.ts`
- Create: `argus/lib/conformance/checks/capabilities/C-02.resources-list/check.ts`
- Create: `argus/lib/conformance/checks/capabilities/C-03.prompts-list/check.ts`
- Create: `argus/lib/conformance/checks/capabilities/C-04.logging-setlevel/check.ts`
- Create: `argus/lib/conformance/checks/capabilities/C-05.completion-complete/check.ts`
- Create: `argus/lib/conformance/checks/capabilities/C-06.undeclared-rejected/check.ts`
- Test: `argus/tests/unit/conformance/checks/capabilities.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

Spec base URL: `https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle#capabilities`

- [ ] **Step 1: Write combined test**

```ts
// argus/tests/unit/conformance/checks/capabilities.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTortureApp, type ViolationToggles } from '../../../../../torture-server/src/index'
import { createMcpClient } from '@/lib/conformance/client'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import C01 from '@/lib/conformance/checks/capabilities/C-01.tools-list/check'
import C02 from '@/lib/conformance/checks/capabilities/C-02.resources-list/check'
import C03 from '@/lib/conformance/checks/capabilities/C-03.prompts-list/check'
import C04 from '@/lib/conformance/checks/capabilities/C-04.logging-setlevel/check'
import C05 from '@/lib/conformance/checks/capabilities/C-05.completion-complete/check'
import C06 from '@/lib/conformance/checks/capabilities/C-06.undeclared-rejected/check'
import type { CheckContext } from '@/lib/conformance/types'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'

let server: Server, port: number, toggles: ViolationToggles

beforeAll(async () => {
  toggles = {}
  const app = createTortureApp({ violations: toggles })
  await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => r()) })
  port = (server.address() as AddressInfo).port
})
afterAll(() => new Promise<void>((r) => server.close(() => r())))

function ctx(caps: any = { tools: {}, resources: {}, prompts: {}, logging: {}, completions: {} }): CheckContext {
  const url = `http://127.0.0.1:${port}/mcp`
  const rawHttp = createRawHttpClient({ url })
  const transport = createHttpTransport({ url, spec: 'DRAFT-2026-v1', rawHttp })
  return {
    client: createMcpClient(transport, 'DRAFT-2026-v1', url),
    rawHttp, transport: { kind: 'http', url }, spec: 'DRAFT-2026-v1',
    serverInfo: { name: 't', version: '0' }, capabilities: caps, log: () => {},
  }
}

describe('Capabilities pass', () => {
  it.each([C01, C02, C03, C04, C05])('passes when declared', async (chk) => {
    Object.keys(toggles).forEach((k) => delete (toggles as any)[k])
    expect((await chk.run(ctx())).status).toBe('pass')
  })
  it('C-06 passes — undeclared tools rejected with -32601', async () => {
    Object.keys(toggles).forEach((k) => delete (toggles as any)[k])
    expect((await C06.run(ctx({}))).status).toBe('pass')
  })
})

describe('Capabilities skip', () => {
  it.each([C01, C02, C03, C04, C05])('skips when capability not declared', async (chk) => {
    Object.keys(toggles).forEach((k) => delete (toggles as any)[k])
    expect((await chk.run(ctx({}))).status).toBe('skip')
  })
})
```

- [ ] **Step 2: Implement all six check files**

Each follows the pattern:

```ts
// argus/lib/conformance/checks/capabilities/C-01.tools-list/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'C-01', category: 'capabilities', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'capabilities.tools declared → tools/list returns valid response',
  probe: 'If server declared tools capability, call tools/list.',
  criterion: 'Response MUST contain `tools` array.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle#capabilities',
    section: 'Server capabilities',
    quote: 'tools — Indicates that the server offers tools.',
  },
  requires: { capability: 'tools' },
  deterministic: true,
  async run(ctx) {
    const { result, error, raw } = await ctx.client.call('tools/list', {})
    if (error || !Array.isArray((result as any)?.tools)) {
      return {
        checkId: 'C-01', status: 'fail', durationMs: 0,
        message: `tools/list did not return valid response: ${error?.message ?? 'no tools array'}.`,
        evidence: { response: raw, expected: '{ tools: [...] }', actual: result ?? error },
      }
    }
    return { checkId: 'C-01', status: 'pass', durationMs: 0, evidence: { response: raw } }
  },
}
export default check
```

Repeat per check, swapping `id`/`method`/`requires.capability`/`title`:
- C-02: `resources/list`, capability `resources`, expected field `resources`
- C-03: `prompts/list`, capability `prompts`, expected field `prompts`
- C-04: `logging/setLevel`, params `{ level: 'info' }`, capability `logging`, expect `result` truthy (any non-error response)
- C-05: `completion/complete`, params `{ ref: { type: 'ref/prompt', name: 'x' }, argument: { name: 'a', value: 'b' } }`, capability `completions`, expected field `completion`
- C-06: NO capability declared, call `tools/list`, expect `error.code === -32601`

C-06 inverts: requires `{ capabilityNotDeclared: 'tools' }` — extend `requires` type if needed, or implement inline check:

```ts
// argus/lib/conformance/checks/capabilities/C-06.undeclared-rejected/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'C-06', category: 'capabilities', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'capabilities.tools NOT declared → tools/list returns -32601',
  probe: 'If server did not declare tools capability, calling tools/list must return MethodNotFound.',
  criterion: 'Server MUST NOT silently accept calls for undeclared capabilities.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle#capabilities',
    section: 'Server capabilities',
    quote: 'Servers MUST only respond to methods that correspond to declared capabilities.',
  },
  deterministic: true,
  async run(ctx) {
    if ((ctx.capabilities as any)?.tools) {
      return { checkId: 'C-06', status: 'skip', durationMs: 0, message: 'tools capability declared; check N/A.' }
    }
    const { error } = await ctx.client.call('tools/list', {})
    if (error?.code === -32601) {
      return { checkId: 'C-06', status: 'pass', durationMs: 0, evidence: { actual: error.code } }
    }
    return {
      checkId: 'C-06', status: 'fail', durationMs: 0,
      message: `Expected -32601 for undeclared tools, got ${error?.code ?? '(no error)'}.`,
      evidence: { expected: -32601, actual: error?.code ?? null },
    }
  },
}
export default check
```

- [ ] **Step 3: Update registry**

```ts
registerChecks(C01, C02, C03, C04, C05, C06)
```

- [ ] **Step 4: Run tests, commit**

```bash
cd argus && pnpm test tests/unit/conformance/checks/capabilities.test.ts -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/capabilities argus/tests/unit/conformance/checks/capabilities.test.ts argus/lib/conformance/registry.ts && git commit -m "feat(argus): add Capabilities checks C-01..C-06"
```

---

### Task 27: Tools checks

**Files:**
- Create: `argus/lib/conformance/checks/tools/TL-01.tool-shape/check.ts`
- Create: `argus/lib/conformance/checks/tools/TL-02.input-schema-valid/check.ts`
- Create: `argus/lib/conformance/checks/tools/TL-05.unique-names/check.ts`
- Create: `argus/lib/conformance/checks/tools/TL-08.missing-tool/check.ts`
- Create: `argus/lib/conformance/checks/tools/TL-09.invalid-input/check.ts`
- Test: `argus/tests/unit/conformance/checks/tools.test.ts`
- Modify: `argus/lib/conformance/registry.ts`
- Modify: `argus/package.json` (add `ajv`, `ajv-formats`)

Spec base URL: `https://modelcontextprotocol.io/specification/2025-11-25/server/tools`

- [ ] **Step 1: Add ajv dependency**

```bash
cd argus && pnpm add ajv@^8 ajv-formats@^3
```

- [ ] **Step 2: Write combined test** (pattern from Task 25). torture-server has a built-in tool `echo` with valid schema for pass cases; toggle flags TL-01, TL-05, TL-08, TL-09 trigger violations.

- [ ] **Step 3: Implement TL-01 tool-shape**

```ts
// argus/lib/conformance/checks/tools/TL-01.tool-shape/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'TL-01', category: 'tools', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Every tool has name, description, inputSchema',
  probe: 'List tools; inspect every entry for required fields.',
  criterion: 'Each tool MUST have string `name`, string `description`, object `inputSchema`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'Tool definition',
    quote: 'Each tool definition includes a name, description, and inputSchema.',
  },
  requires: { capability: 'tools' },
  deterministic: true,
  async run(ctx) {
    const { result, raw } = await ctx.client.call('tools/list', {})
    const tools = (result as any)?.tools ?? []
    const bad: any[] = []
    for (const t of tools) {
      const issues: string[] = []
      if (typeof t?.name !== 'string') issues.push('name not string')
      if (typeof t?.description !== 'string') issues.push('description not string')
      if (!t?.inputSchema || typeof t.inputSchema !== 'object') issues.push('inputSchema missing/not object')
      if (issues.length) bad.push({ tool: t?.name ?? '(unknown)', issues })
    }
    if (bad.length === 0) {
      return { checkId: 'TL-01', status: 'pass', durationMs: 0, evidence: { response: raw } }
    }
    return {
      checkId: 'TL-01', status: 'fail', durationMs: 0,
      message: `${bad.length} tool(s) missing required fields: ${bad.map((b) => b.tool).join(', ')}.`,
      evidence: { response: raw, actual: bad, expected: '{ name: string, description: string, inputSchema: object }' },
    }
  },
}
export default check
```

- [ ] **Step 4: Implement TL-02 input-schema-valid**

```ts
// argus/lib/conformance/checks/tools/TL-02.input-schema-valid/check.ts
import type { Check } from '../../../types'
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'

const check: Check = {
  id: 'TL-02', category: 'tools', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'inputSchema is valid JSON Schema (2020-12 default)',
  probe: 'Validate each inputSchema with ajv; report any compile errors.',
  criterion: 'inputSchema MUST parse as valid JSON Schema using the dialect from `$schema` (default 2020-12).',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'inputSchema',
    quote: 'inputSchema is a JSON Schema describing the expected parameters.',
  },
  requires: { capability: 'tools' },
  deterministic: true,
  async run(ctx) {
    const ajv = new Ajv2020({ strict: false, allErrors: true })
    addFormats(ajv)
    const { result, raw } = await ctx.client.call('tools/list', {})
    const tools = (result as any)?.tools ?? []
    const bad: any[] = []
    for (const t of tools) {
      try { ajv.compile(t.inputSchema) }
      catch (e: any) { bad.push({ tool: t.name, error: e.message }) }
    }
    if (bad.length === 0) {
      return { checkId: 'TL-02', status: 'pass', durationMs: 0, evidence: { response: raw } }
    }
    return {
      checkId: 'TL-02', status: 'fail', durationMs: 0,
      message: `${bad.length} tool inputSchema(s) failed to compile.`,
      evidence: { actual: bad, expected: 'valid JSON Schema 2020-12' },
    }
  },
}
export default check
```

- [ ] **Step 5: Implement TL-05 unique-names**

```ts
// argus/lib/conformance/checks/tools/TL-05.unique-names/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'TL-05', category: 'tools', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Tools list has no duplicate names',
  probe: 'Collect all tool names; check for duplicates.',
  criterion: 'Tool names MUST be unique within the list.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'Tool definition',
    quote: 'Tool names MUST be unique within a server.',
  },
  requires: { capability: 'tools' },
  deterministic: true,
  async run(ctx) {
    const { result, raw } = await ctx.client.call('tools/list', {})
    const tools = (result as any)?.tools ?? []
    const seen = new Set<string>()
    const dupes = new Set<string>()
    for (const t of tools) {
      if (seen.has(t.name)) dupes.add(t.name)
      seen.add(t.name)
    }
    if (dupes.size === 0) {
      return { checkId: 'TL-05', status: 'pass', durationMs: 0, evidence: { response: raw } }
    }
    return {
      checkId: 'TL-05', status: 'fail', durationMs: 0,
      message: `Duplicate tool names: ${[...dupes].join(', ')}.`,
      evidence: { actual: [...dupes], expected: 'unique names' },
    }
  },
}
export default check
```

- [ ] **Step 6: Implement TL-08 missing-tool**

```ts
// argus/lib/conformance/checks/tools/TL-08.missing-tool/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'TL-08', category: 'tools', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'tools/call with unknown name returns protocol error',
  probe: 'Call tools/call with name "definitely_not_a_tool".',
  criterion: 'Unknown tool name MUST yield JSON-RPC error (not result.isError).',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'tools/call',
    quote: 'If the tool does not exist, the server MUST return an error.',
  },
  requires: { capability: 'tools' },
  deterministic: true,
  async run(ctx) {
    const { error, result, raw } = await ctx.client.call('tools/call', {
      name: 'definitely_not_a_tool',
      arguments: {},
    })
    if (error) {
      return { checkId: 'TL-08', status: 'pass', durationMs: 0, evidence: { response: raw, actual: error.code } }
    }
    return {
      checkId: 'TL-08', status: 'fail', durationMs: 0,
      message: 'Unknown tool returned success result instead of JSON-RPC error.',
      evidence: { response: raw, expected: 'JSON-RPC error', actual: result },
    }
  },
}
export default check
```

- [ ] **Step 7: Implement TL-09 invalid-input**

```ts
// argus/lib/conformance/checks/tools/TL-09.invalid-input/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'TL-09', category: 'tools', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Schema-violating tool input returns result.isError: true (not -32602)',
  probe: 'Find a tool with required field, call with empty arguments; expect result.isError.',
  criterion: 'Schema violations MUST surface as `result.isError: true`, NOT JSON-RPC error.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'Error handling',
    quote: 'Tool execution errors MUST be reported via isError: true in the result, not as JSON-RPC errors.',
  },
  requires: { capability: 'tools' },
  deterministic: true,
  async run(ctx) {
    const list = await ctx.client.call('tools/list', {})
    const tool = ((list.result as any)?.tools ?? []).find(
      (t: any) => Array.isArray(t?.inputSchema?.required) && t.inputSchema.required.length > 0,
    )
    if (!tool) {
      return { checkId: 'TL-09', status: 'skip', durationMs: 0, message: 'No tool with required input found.' }
    }
    const { error, result, raw } = await ctx.client.call('tools/call', { name: tool.name, arguments: {} })
    if (!error && (result as any)?.isError === true) {
      return { checkId: 'TL-09', status: 'pass', durationMs: 0, evidence: { response: raw } }
    }
    return {
      checkId: 'TL-09', status: 'fail', durationMs: 0,
      message: error
        ? `Schema violation returned JSON-RPC error ${error.code} instead of result.isError.`
        : 'Schema violation did not set result.isError: true.',
      evidence: { response: raw, expected: 'result.isError: true', actual: error ?? result },
    }
  },
}
export default check
```

- [ ] **Step 8: Update registry, run, commit**

```ts
registerChecks(TL01, TL02, TL05, TL08, TL09)
```

```bash
cd argus && pnpm test tests/unit/conformance/checks/tools.test.ts -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/tools argus/tests/unit/conformance/checks/tools.test.ts argus/lib/conformance/registry.ts argus/package.json argus/pnpm-lock.yaml && git commit -m "feat(argus): add Tools checks TL-01, TL-02, TL-05, TL-08, TL-09"
```

---

### Task 28: Resources checks

**Files:**
- Create: `argus/lib/conformance/checks/resources/R-01.resource-shape/check.ts`
- Create: `argus/lib/conformance/checks/resources/R-04.unknown-uri/check.ts`
- Create: `argus/lib/conformance/checks/resources/R-07.content-types/check.ts`
- Test: `argus/tests/unit/conformance/checks/resources.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

Spec base URL: `https://modelcontextprotocol.io/specification/2025-11-25/server/resources`

- [ ] **Step 1: Implement R-01 resource-shape**

```ts
// argus/lib/conformance/checks/resources/R-01.resource-shape/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'R-01', category: 'resources', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Every resource has uri and name',
  probe: 'List resources; inspect required fields.',
  criterion: 'Each resource MUST have string `uri` and string `name`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/resources',
    section: 'Resource definition',
    quote: 'Each resource has a uri and a human-readable name.',
  },
  requires: { capability: 'resources' },
  deterministic: true,
  async run(ctx) {
    const { result, raw } = await ctx.client.call('resources/list', {})
    const items = (result as any)?.resources ?? []
    const bad = items.filter((r: any) => typeof r?.uri !== 'string' || typeof r?.name !== 'string')
    if (bad.length === 0) {
      return { checkId: 'R-01', status: 'pass', durationMs: 0, evidence: { response: raw } }
    }
    return {
      checkId: 'R-01', status: 'fail', durationMs: 0,
      message: `${bad.length} resource(s) missing required string uri/name.`,
      evidence: { actual: bad, expected: '{ uri: string, name: string }' },
    }
  },
}
export default check
```

- [ ] **Step 2: Implement R-04 unknown-uri**

```ts
// argus/lib/conformance/checks/resources/R-04.unknown-uri/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'R-04', category: 'resources', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'resources/read with unknown uri returns error',
  probe: 'Call resources/read with `uri: "argus://nonexistent/9999"`.',
  criterion: 'Unknown URI MUST yield JSON-RPC error.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/resources',
    section: 'resources/read',
    quote: 'If the resource does not exist, the server MUST return an error.',
  },
  requires: { capability: 'resources' },
  deterministic: true,
  async run(ctx) {
    const { error, raw } = await ctx.client.call('resources/read', { uri: 'argus://nonexistent/9999' })
    if (error) {
      return { checkId: 'R-04', status: 'pass', durationMs: 0, evidence: { response: raw, actual: error.code } }
    }
    return {
      checkId: 'R-04', status: 'fail', durationMs: 0,
      message: 'Unknown resource URI returned success instead of error.',
      evidence: { response: raw, expected: 'JSON-RPC error' },
    }
  },
}
export default check
```

- [ ] **Step 3: Implement R-07 content-types**

```ts
// argus/lib/conformance/checks/resources/R-07.content-types/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'R-07', category: 'resources', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Resource contents use text XOR blob, with mimeType',
  probe: 'Read first listed resource; verify contents shape.',
  criterion: 'Each content entry MUST have either `text` (string) or `blob` (base64 string), plus `mimeType`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/resources',
    section: 'Resource contents',
    quote: 'Each content item has either text or blob, plus the mimeType.',
  },
  requires: { capability: 'resources' },
  deterministic: true,
  async run(ctx) {
    const list = await ctx.client.call('resources/list', {})
    const first = ((list.result as any)?.resources ?? [])[0]
    if (!first) {
      return { checkId: 'R-07', status: 'skip', durationMs: 0, message: 'No resources to read.' }
    }
    const { result, raw } = await ctx.client.call('resources/read', { uri: first.uri })
    const contents = (result as any)?.contents ?? []
    const bad = contents.filter((c: any) => {
      const hasText = typeof c?.text === 'string'
      const hasBlob = typeof c?.blob === 'string'
      const hasMime = typeof c?.mimeType === 'string'
      return !hasMime || hasText === hasBlob
    })
    if (contents.length > 0 && bad.length === 0) {
      return { checkId: 'R-07', status: 'pass', durationMs: 0, evidence: { response: raw } }
    }
    return {
      checkId: 'R-07', status: 'fail', durationMs: 0,
      message: `Resource contents shape invalid (${bad.length} of ${contents.length} bad).`,
      evidence: { response: raw, actual: bad, expected: '{ text|blob, mimeType }' },
    }
  },
}
export default check
```

- [ ] **Step 4: Test, register, commit**

```ts
registerChecks(R01, R04, R07)
```

```bash
cd argus && pnpm test tests/unit/conformance/checks/resources.test.ts -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/resources argus/tests/unit/conformance/checks/resources.test.ts argus/lib/conformance/registry.ts && git commit -m "feat(argus): add Resources checks R-01, R-04, R-07"
```

---

### Task 29: Prompts checks

**Files:**
- Create: `argus/lib/conformance/checks/prompts/P-01.prompt-shape/check.ts`
- Create: `argus/lib/conformance/checks/prompts/P-04.get-arguments/check.ts`
- Test: `argus/tests/unit/conformance/checks/prompts.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

Spec base URL: `https://modelcontextprotocol.io/specification/2025-11-25/server/prompts`

- [ ] **Step 1: Implement P-01 prompt-shape**

```ts
// argus/lib/conformance/checks/prompts/P-01.prompt-shape/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'P-01', category: 'prompts', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Every prompt has name; description and arguments typed correctly if present',
  probe: 'List prompts; verify name is string, arguments is array if present.',
  criterion: 'Prompt MUST have string `name`; `arguments` (if present) MUST be array of `{ name, description?, required? }`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/prompts',
    section: 'Prompt definition',
    quote: 'Each prompt has a name and may have arguments.',
  },
  requires: { capability: 'prompts' },
  deterministic: true,
  async run(ctx) {
    const { result, raw } = await ctx.client.call('prompts/list', {})
    const prompts = (result as any)?.prompts ?? []
    const bad: any[] = []
    for (const p of prompts) {
      const issues: string[] = []
      if (typeof p?.name !== 'string') issues.push('name not string')
      if ('arguments' in p && !Array.isArray(p.arguments)) issues.push('arguments not array')
      if (Array.isArray(p.arguments)) {
        for (const a of p.arguments) {
          if (typeof a?.name !== 'string') issues.push('argument.name not string')
        }
      }
      if (issues.length) bad.push({ prompt: p?.name ?? '?', issues })
    }
    if (bad.length === 0) {
      return { checkId: 'P-01', status: 'pass', durationMs: 0, evidence: { response: raw } }
    }
    return {
      checkId: 'P-01', status: 'fail', durationMs: 0,
      message: `${bad.length} prompt(s) malformed.`,
      evidence: { response: raw, actual: bad },
    }
  },
}
export default check
```

- [ ] **Step 2: Implement P-04 get-arguments**

```ts
// argus/lib/conformance/checks/prompts/P-04.get-arguments/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'P-04', category: 'prompts', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'prompts/get without required argument returns error',
  probe: 'Find a prompt with required argument; call prompts/get without it.',
  criterion: 'Server MUST return JSON-RPC error when required argument missing.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/prompts',
    section: 'prompts/get',
    quote: 'If required arguments are missing, the server MUST return an error.',
  },
  requires: { capability: 'prompts' },
  deterministic: true,
  async run(ctx) {
    const list = await ctx.client.call('prompts/list', {})
    const prompt = ((list.result as any)?.prompts ?? []).find(
      (p: any) => Array.isArray(p?.arguments) && p.arguments.some((a: any) => a.required),
    )
    if (!prompt) {
      return { checkId: 'P-04', status: 'skip', durationMs: 0, message: 'No prompt with required argument.' }
    }
    const { error, raw } = await ctx.client.call('prompts/get', { name: prompt.name, arguments: {} })
    if (error) {
      return { checkId: 'P-04', status: 'pass', durationMs: 0, evidence: { response: raw, actual: error.code } }
    }
    return {
      checkId: 'P-04', status: 'fail', durationMs: 0,
      message: 'Missing required argument did not produce error.',
      evidence: { response: raw, expected: 'JSON-RPC error' },
    }
  },
}
export default check
```

- [ ] **Step 3: Register, test, commit**

```ts
registerChecks(P01, P04)
```

```bash
cd argus && pnpm test tests/unit/conformance/checks/prompts.test.ts -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/prompts argus/tests/unit/conformance/checks/prompts.test.ts argus/lib/conformance/registry.ts && git commit -m "feat(argus): add Prompts checks P-01, P-04"
```

---

### Task 30: Sampling checks

**Files:**
- Create: `argus/lib/conformance/checks/sampling/SMP-01.declared-capability/check.ts`
- Create: `argus/lib/conformance/checks/sampling/SMP-02.back-request-shape/check.ts`
- Test: `argus/tests/unit/conformance/checks/sampling.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

Spec base URL: `https://modelcontextprotocol.io/specification/2025-11-25/client/sampling`

- [ ] **Step 1: Implement SMP-01 declared-capability**

```ts
// argus/lib/conformance/checks/sampling/SMP-01.declared-capability/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'SMP-01', category: 'sampling', severity: 'warning', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Server invokes sampling/createMessage only when client declared sampling',
  probe: 'Call any tool that requests sampling. Argus declares sampling capability so this should succeed.',
  criterion: 'Servers MUST only issue sampling/createMessage if the client declared sampling capability.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/client/sampling',
    section: 'Capability requirement',
    quote: 'Servers MUST only issue sampling requests if the client declared the sampling capability.',
  },
  requires: { tool: '__torture/sampling-probe' },
  deterministic: true,
  async run(ctx) {
    const list = await ctx.client.call('tools/list', {})
    const probe = ((list.result as any)?.tools ?? []).find((t: any) => t.name === '__torture/sampling-probe')
    if (!probe) {
      return { checkId: 'SMP-01', status: 'skip', durationMs: 0, message: 'No sampling-probe tool available.' }
    }
    const { result, error, raw } = await ctx.client.call('tools/call', {
      name: '__torture/sampling-probe', arguments: {},
    })
    if (!error && (result as any)?.isError !== true) {
      return { checkId: 'SMP-01', status: 'pass', durationMs: 0, evidence: { response: raw } }
    }
    return {
      checkId: 'SMP-01', status: 'fail', durationMs: 0,
      message: 'Server failed sampling probe even though client declared sampling.',
      evidence: { response: raw, actual: error ?? result },
    }
  },
}
export default check
```

- [ ] **Step 2: Implement SMP-02 back-request-shape**

```ts
// argus/lib/conformance/checks/sampling/SMP-02.back-request-shape/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'SMP-02', category: 'sampling', severity: 'error', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'sampling/createMessage back-request has messages array and modelPreferences',
  probe: 'Capture the sampling back-request via instrumented client.handleRequest; inspect shape.',
  criterion: 'Server-initiated sampling/createMessage MUST include `messages: [...]` and `modelPreferences` (if specified).',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/client/sampling',
    section: 'createMessage request',
    quote: 'The request includes messages, modelPreferences, and other generation parameters.',
  },
  requires: { tool: '__torture/sampling-probe' },
  deterministic: false,
  async run(ctx) {
    const captured: any[] = []
    ctx.client.onRequest((req) => {
      if (req.method === 'sampling/createMessage') captured.push(req)
      return { content: [{ type: 'text', text: 'ack' }], model: 'argus-stub', role: 'assistant' }
    })
    await ctx.client.call('tools/call', { name: '__torture/sampling-probe', arguments: {} })
    if (captured.length === 0) {
      return { checkId: 'SMP-02', status: 'skip', durationMs: 0, message: 'Server never issued sampling/createMessage.' }
    }
    const req = captured[0]
    const okMessages = Array.isArray(req.params?.messages)
    if (okMessages) {
      return { checkId: 'SMP-02', status: 'pass', durationMs: 0, evidence: { request: req } }
    }
    return {
      checkId: 'SMP-02', status: 'fail', durationMs: 0,
      message: 'sampling/createMessage back-request missing `messages` array.',
      evidence: { request: req, expected: 'messages: []' },
    }
  },
}
export default check
```

Note: `client.onRequest` is an extension on the MCP client to register a handler for server→client requests. Add this method to `argus/lib/conformance/client.ts` in this task:

```ts
// extend createMcpClient return:
const handlers: Record<string, (req: any) => any> = {}
function onRequest(method: string | ((req: any) => any), maybeFn?: (req: any) => any) {
  if (typeof method === 'function') {
    // register catch-all on first call
    handlers.__any = method
  } else if (maybeFn) {
    handlers[method] = maybeFn
  }
}
// wire into transport: when transport surfaces server→client request, call handlers[req.method] ?? handlers.__any
```

Also add to `torture-server`: a built-in tool `__torture/sampling-probe` that issues a `sampling/createMessage` back-request over the same HTTP connection (use SSE response branch).

- [ ] **Step 3: Register, test, commit**

```ts
registerChecks(SMP01, SMP02)
```

```bash
cd argus && pnpm test tests/unit/conformance/checks/sampling.test.ts -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/sampling argus/tests/unit/conformance/checks/sampling.test.ts argus/lib/conformance/registry.ts argus/lib/conformance/client.ts torture-server/src/index.ts && git commit -m "feat(argus): add Sampling checks SMP-01, SMP-02 + client onRequest"
```

---

### Task 31: Elicitation checks

**Files:**
- Create: `argus/lib/conformance/checks/elicitation/EL-01.declared-capability/check.ts`
- Create: `argus/lib/conformance/checks/elicitation/EL-02.form-or-url/check.ts`
- Test: `argus/tests/unit/conformance/checks/elicitation.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

Spec base URL: `https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation`

- [ ] **Step 1: Implement EL-01 declared-capability**

```ts
// argus/lib/conformance/checks/elicitation/EL-01.declared-capability/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'EL-01', category: 'elicitation', severity: 'warning', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Server invokes elicitation/create only when client declared elicitation',
  probe: 'Call `__torture/elicitation-probe` tool; argus declares elicitation so back-request should succeed.',
  criterion: 'Servers MUST only issue elicitation/create when client declared the elicitation capability.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation',
    section: 'Capability requirement',
    quote: 'Servers MUST only issue elicitation requests if the client declared the elicitation capability.',
  },
  requires: { tool: '__torture/elicitation-probe' },
  deterministic: true,
  async run(ctx) {
    const list = await ctx.client.call('tools/list', {})
    const probe = ((list.result as any)?.tools ?? []).find((t: any) => t.name === '__torture/elicitation-probe')
    if (!probe) return { checkId: 'EL-01', status: 'skip', durationMs: 0, message: 'No probe tool.' }
    ctx.client.onRequest((req) => {
      if (req.method === 'elicitation/create') return { action: 'accept', content: { field: 'stub-value' } }
      return undefined
    })
    const { error, result, raw } = await ctx.client.call('tools/call', {
      name: '__torture/elicitation-probe', arguments: {},
    })
    if (!error && (result as any)?.isError !== true) {
      return { checkId: 'EL-01', status: 'pass', durationMs: 0, evidence: { response: raw } }
    }
    return {
      checkId: 'EL-01', status: 'fail', durationMs: 0,
      message: 'Elicitation probe failed despite declared capability.',
      evidence: { response: raw, actual: error ?? result },
    }
  },
}
export default check
```

- [ ] **Step 2: Implement EL-02 form-or-url**

```ts
// argus/lib/conformance/checks/elicitation/EL-02.form-or-url/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'EL-02', category: 'elicitation', severity: 'error', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'elicitation/create request includes either form (schema) or url',
  probe: 'Capture elicitation/create back-request; verify either `requestedSchema` or `url`.',
  criterion: 'Request MUST contain exactly one of `requestedSchema` (form variant) or `url` (URL variant).',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation',
    section: 'create request',
    quote: 'An elicitation request specifies either a JSON Schema for form rendering or a URL for an external prompt.',
  },
  requires: { tool: '__torture/elicitation-probe' },
  deterministic: false,
  async run(ctx) {
    const captured: any[] = []
    ctx.client.onRequest((req) => {
      if (req.method === 'elicitation/create') captured.push(req)
      return { action: 'accept', content: {} }
    })
    await ctx.client.call('tools/call', { name: '__torture/elicitation-probe', arguments: {} })
    if (captured.length === 0) {
      return { checkId: 'EL-02', status: 'skip', durationMs: 0, message: 'No elicitation/create observed.' }
    }
    const p = captured[0]?.params ?? {}
    const hasForm = !!p.requestedSchema
    const hasUrl = typeof p.url === 'string'
    if (hasForm !== hasUrl) {
      return { checkId: 'EL-02', status: 'pass', durationMs: 0, evidence: { request: captured[0] } }
    }
    return {
      checkId: 'EL-02', status: 'fail', durationMs: 0,
      message: hasForm && hasUrl
        ? 'Request contains both requestedSchema and url.'
        : 'Request contains neither requestedSchema nor url.',
      evidence: { request: captured[0], expected: 'exactly one of form|url' },
    }
  },
}
export default check
```

- [ ] **Step 3: Register, test, commit**

```ts
registerChecks(EL01, EL02)
```

```bash
cd argus && pnpm test tests/unit/conformance/checks/elicitation.test.ts -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/elicitation argus/tests/unit/conformance/checks/elicitation.test.ts argus/lib/conformance/registry.ts torture-server/src/index.ts && git commit -m "feat(argus): add Elicitation checks EL-01, EL-02"
```

---

### Task 32: Utilities checks

**Files:**
- Create: `argus/lib/conformance/checks/utilities/U-01.progress-tokens/check.ts`
- Create: `argus/lib/conformance/checks/utilities/U-04.cancellation/check.ts`
- Create: `argus/lib/conformance/checks/utilities/U-08.logging-levels/check.ts`
- Test: `argus/tests/unit/conformance/checks/utilities.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

Spec base URL: `https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities`

- [ ] **Step 1: Implement U-01 progress-tokens**

```ts
// argus/lib/conformance/checks/utilities/U-01.progress-tokens/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'U-01', category: 'utilities', severity: 'warning', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'progressToken triggers notifications/progress',
  probe: 'Call __torture/slow-tool with _meta.progressToken; expect ≥1 progress notification.',
  criterion: 'When request includes `_meta.progressToken`, server SHOULD emit `notifications/progress` events.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/progress',
    section: 'Progress notifications',
    quote: 'When a request includes a progress token, the server may emit progress notifications.',
  },
  requires: { tool: '__torture/slow-tool' },
  deterministic: false,
  async run(ctx) {
    const events: any[] = []
    ctx.client.onNotification((n) => { if (n.method === 'notifications/progress') events.push(n) })
    const token = 'progress-' + Date.now()
    const { error } = await ctx.client.call('tools/call', {
      name: '__torture/slow-tool', arguments: {}, _meta: { progressToken: token },
    })
    if (error) {
      return { checkId: 'U-01', status: 'fail', durationMs: 0, message: error.message, evidence: { actual: error } }
    }
    const matching = events.filter((e) => e.params?.progressToken === token)
    if (matching.length > 0) {
      return { checkId: 'U-01', status: 'pass', durationMs: 0, evidence: { actual: `${matching.length} progress events` } }
    }
    return {
      checkId: 'U-01', status: 'fail', durationMs: 0,
      message: 'Server emitted no progress notifications for provided progressToken.',
      evidence: { expected: '≥1 notifications/progress with matching token', actual: events },
    }
  },
}
export default check
```

`client.onNotification` is a new extension — register a callback for any server→client notification. Add to `argus/lib/conformance/client.ts` in this task.

- [ ] **Step 2: Implement U-04 cancellation**

```ts
// argus/lib/conformance/checks/utilities/U-04.cancellation/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'U-04', category: 'utilities', severity: 'warning', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'notifications/cancelled aborts in-flight request',
  probe: 'Start slow request; send notifications/cancelled with its id; expect termination within 2 s.',
  criterion: 'Server SHOULD respect cancellation and end the request promptly.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/cancellation',
    section: 'cancellation',
    quote: 'A client may cancel an in-flight request by sending notifications/cancelled with the request id.',
  },
  requires: { tool: '__torture/slow-tool' },
  deterministic: false,
  async run(ctx) {
    const id = ctx.client.nextRequestId()
    const start = Date.now()
    const callP = ctx.client.callWithId(id, 'tools/call', { name: '__torture/slow-tool', arguments: { delayMs: 10000 } })
    await new Promise((r) => setTimeout(r, 200))
    await ctx.client.notify('notifications/cancelled', { requestId: id, reason: 'argus-test' })
    let outcome: 'cancelled' | 'completed' | 'timeout' = 'timeout'
    try {
      const r = await Promise.race([
        callP.then(() => 'completed' as const),
        new Promise<'timeout'>((r) => setTimeout(() => r('timeout'), 2500)),
      ])
      outcome = r as any
    } catch { outcome = 'cancelled' }
    const elapsed = Date.now() - start
    if (outcome !== 'timeout' && elapsed < 2500) {
      return { checkId: 'U-04', status: 'pass', durationMs: elapsed, evidence: { actual: outcome } }
    }
    return {
      checkId: 'U-04', status: 'fail', durationMs: elapsed,
      message: `Cancellation ignored; outcome=${outcome} after ${elapsed}ms.`,
      evidence: { expected: 'terminate within 2.5 s', actual: outcome },
    }
  },
}
export default check
```

Add helpers `client.nextRequestId()` and `client.callWithId(id, method, params)` to client.ts.

- [ ] **Step 3: Implement U-08 logging-levels**

```ts
// argus/lib/conformance/checks/utilities/U-08.logging-levels/check.ts
import type { Check } from '../../../types'

const LEVELS = ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'] as const

const check: Check = {
  id: 'U-08', category: 'utilities', severity: 'warning', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'logging/setLevel accepts standard RFC 5424 level names',
  probe: 'Call logging/setLevel for each standard level; expect success.',
  criterion: 'Server MUST accept all eight standard RFC 5424 level names.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/logging',
    section: 'logging/setLevel',
    quote: 'Levels follow RFC 5424: debug, info, notice, warning, error, critical, alert, emergency.',
  },
  requires: { capability: 'logging' },
  deterministic: true,
  async run(ctx) {
    const failed: string[] = []
    for (const level of LEVELS) {
      const { error } = await ctx.client.call('logging/setLevel', { level })
      if (error) failed.push(`${level}:${error.code}`)
    }
    if (failed.length === 0) {
      return { checkId: 'U-08', status: 'pass', durationMs: 0, evidence: { actual: LEVELS.join(',') } }
    }
    return {
      checkId: 'U-08', status: 'fail', durationMs: 0,
      message: `Server rejected level(s): ${failed.join(', ')}.`,
      evidence: { expected: LEVELS.join(','), actual: failed },
    }
  },
}
export default check
```

- [ ] **Step 4: Register, test, commit**

```ts
registerChecks(U01, U04, U08)
```

```bash
cd argus && pnpm test tests/unit/conformance/checks/utilities.test.ts -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/utilities argus/tests/unit/conformance/checks/utilities.test.ts argus/lib/conformance/registry.ts argus/lib/conformance/client.ts torture-server/src/index.ts && git commit -m "feat(argus): add Utilities checks U-01, U-04, U-08 + client onNotification"
```

---

### Task 33: Authorization checks

**Files:**
- Create: `argus/lib/conformance/checks/authorization/AUTH-01.unauthenticated-401/check.ts`
- Create: `argus/lib/conformance/checks/authorization/AUTH-02.www-authenticate-resource/check.ts`
- Create: `argus/lib/conformance/checks/authorization/AUTH-03.protected-resource-metadata/check.ts`
- Create: `argus/lib/conformance/checks/authorization/AUTH-10.no-url-token/check.ts`
- Test: `argus/tests/unit/conformance/checks/authorization.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

Spec base URL: `https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization`

Argus declares an "auth-mode" flag on the scan composer (`none` | `oauth-discovery`). Checks here gate on `auth-mode === 'oauth-discovery'`.

- [ ] **Step 1: Implement AUTH-01 unauthenticated-401**

```ts
// argus/lib/conformance/checks/authorization/AUTH-01.unauthenticated-401/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'AUTH-01', category: 'authorization', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Request without Authorization → 401 with WWW-Authenticate: Bearer',
  probe: 'POST initialize without Authorization header; expect 401.',
  criterion: 'Server MUST respond 401 and include `WWW-Authenticate: Bearer ...` header.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization',
    section: 'OAuth challenge',
    quote: 'Unauthenticated requests MUST receive a 401 response with a WWW-Authenticate: Bearer challenge.',
  },
  requires: { authMode: 'oauth-discovery' },
  deterministic: true,
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'AUTH-01', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }
    const url = ctx.transport.url!
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'MCP-Protocol-Version': ctx.spec,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
    })
    const wwwAuth = res.headers.get('www-authenticate') ?? ''
    if (res.status === 401 && /bearer/i.test(wwwAuth)) {
      return { checkId: 'AUTH-01', status: 'pass', durationMs: 0, evidence: { actual: { status: 401, wwwAuth } } }
    }
    return {
      checkId: 'AUTH-01', status: 'fail', durationMs: 0,
      message: `Expected 401 + WWW-Authenticate: Bearer, got ${res.status} / "${wwwAuth}".`,
      evidence: { expected: '401 + WWW-Authenticate: Bearer', actual: { status: res.status, wwwAuth } },
    }
  },
}
export default check
```

- [ ] **Step 2: Implement AUTH-02 www-authenticate-resource**

```ts
// argus/lib/conformance/checks/authorization/AUTH-02.www-authenticate-resource/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'AUTH-02', category: 'authorization', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'WWW-Authenticate includes resource_metadata="..." URL',
  probe: 'Inspect the WWW-Authenticate header value from AUTH-01.',
  criterion: 'Bearer challenge MUST include `resource_metadata="https://..."` parameter.',
  specRef: {
    url: 'https://datatracker.ietf.org/doc/html/rfc9728',
    section: 'RFC 9728',
    quote: 'The Bearer challenge SHOULD include resource_metadata pointing to the protected-resource metadata document.',
  },
  requires: { authMode: 'oauth-discovery' },
  deterministic: true,
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'AUTH-02', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }
    const url = ctx.transport.url!
    const res = await fetch(url, { method: 'POST', body: '{}' })
    const wwwAuth = res.headers.get('www-authenticate') ?? ''
    const m = wwwAuth.match(/resource_metadata="([^"]+)"/i)
    if (m && /^https?:\/\//.test(m[1])) {
      return { checkId: 'AUTH-02', status: 'pass', durationMs: 0, evidence: { actual: { resource_metadata: m[1] } } }
    }
    return {
      checkId: 'AUTH-02', status: 'fail', durationMs: 0,
      message: 'WWW-Authenticate missing resource_metadata="..." URL.',
      evidence: { expected: 'Bearer ... resource_metadata="https://..."', actual: { wwwAuth } },
    }
  },
}
export default check
```

- [ ] **Step 3: Implement AUTH-03 protected-resource-metadata**

```ts
// argus/lib/conformance/checks/authorization/AUTH-03.protected-resource-metadata/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'AUTH-03', category: 'authorization', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: '.well-known/oauth-protected-resource returns valid RFC 9728 JSON',
  probe: 'Extract resource_metadata URL from AUTH-02; GET it; verify shape.',
  criterion: 'Document MUST include `resource`, `authorization_servers[]`, `scopes_supported[]`.',
  specRef: {
    url: 'https://datatracker.ietf.org/doc/html/rfc9728',
    section: 'Protected resource metadata',
    quote: 'The metadata document MUST contain the resource identifier and a list of authorization servers.',
  },
  requires: { authMode: 'oauth-discovery' },
  deterministic: true,
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'AUTH-03', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }
    const url = ctx.transport.url!
    const challenge = await fetch(url, { method: 'POST', body: '{}' })
    const m = (challenge.headers.get('www-authenticate') ?? '').match(/resource_metadata="([^"]+)"/i)
    if (!m) {
      return { checkId: 'AUTH-03', status: 'skip', durationMs: 0, message: 'No resource_metadata URL.' }
    }
    const res = await fetch(m[1])
    if (!res.ok) {
      return {
        checkId: 'AUTH-03', status: 'fail', durationMs: 0,
        message: `Metadata URL returned HTTP ${res.status}.`,
        evidence: { actual: { status: res.status } },
      }
    }
    const body = await res.json().catch(() => null)
    const ok = body
      && typeof body.resource === 'string'
      && Array.isArray(body.authorization_servers)
      && Array.isArray(body.scopes_supported)
    if (ok) {
      return { checkId: 'AUTH-03', status: 'pass', durationMs: 0, evidence: { response: body } }
    }
    return {
      checkId: 'AUTH-03', status: 'fail', durationMs: 0,
      message: 'Metadata document missing required RFC 9728 fields.',
      evidence: { expected: '{ resource, authorization_servers[], scopes_supported[] }', actual: body },
    }
  },
}
export default check
```

- [ ] **Step 4: Implement AUTH-10 no-url-token**

```ts
// argus/lib/conformance/checks/authorization/AUTH-10.no-url-token/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'AUTH-10', category: 'authorization', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Tokens passed via URL query parameter are rejected',
  probe: 'POST initialize with `?access_token=xxx` in URL; expect 4xx error.',
  criterion: 'Server MUST NOT accept access tokens in URL parameters (only Authorization header).',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization',
    section: 'Token transmission',
    quote: 'Access tokens MUST NOT be transmitted in URL parameters.',
  },
  requires: { authMode: 'oauth-discovery' },
  deterministic: true,
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'AUTH-10', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }
    const url = ctx.transport.url! + '?access_token=fake-token-for-argus-probe'
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
    })
    if (res.status >= 400 && res.status < 500) {
      return { checkId: 'AUTH-10', status: 'pass', durationMs: 0, evidence: { actual: { status: res.status } } }
    }
    return {
      checkId: 'AUTH-10', status: 'fail', durationMs: 0,
      message: `Server accepted URL token (status ${res.status}); SHOULD reject with 4xx.`,
      evidence: { expected: '4xx rejection', actual: { status: res.status } },
    }
  },
}
export default check
```

- [ ] **Step 5: Register, test, commit**

```ts
registerChecks(AUTH01, AUTH02, AUTH03, AUTH10)
```

```bash
cd argus && pnpm test tests/unit/conformance/checks/authorization.test.ts -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/authorization argus/tests/unit/conformance/checks/authorization.test.ts argus/lib/conformance/registry.ts torture-server/src/index.ts && git commit -m "feat(argus): add Authorization checks AUTH-01, AUTH-02, AUTH-03, AUTH-10"
```

---

### Task 34: Security checks

**Files:**
- Create: `argus/lib/conformance/checks/security/S-01.origin-validation/check.ts`
- Create: `argus/lib/conformance/checks/security/S-04.tls-required/check.ts`
- Test: `argus/tests/unit/conformance/checks/security.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

Spec base URL: `https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices`

- [ ] **Step 1: Implement S-01 origin-validation (cross-references T-07)**

```ts
// argus/lib/conformance/checks/security/S-01.origin-validation/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'S-01', category: 'security', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Server rejects requests with disallowed Origin header',
  probe: 'Same probe as T-07 (Origin: https://attacker.example) — but classified as security here.',
  criterion: 'Origin enforcement is a security boundary; missing it = DNS rebinding risk.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices',
    section: 'Origin validation',
    quote: 'Servers MUST validate the Origin header to prevent DNS rebinding attacks.',
  },
  deterministic: true,
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'S-01', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }
    const url = ctx.transport.url!
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: 'https://attacker.example',
        'MCP-Protocol-Version': ctx.spec,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
    })
    if (res.status === 403 || res.status === 400) {
      return { checkId: 'S-01', status: 'pass', durationMs: 0, evidence: { actual: { status: res.status } } }
    }
    return {
      checkId: 'S-01', status: 'fail', durationMs: 0,
      message: `Server accepted disallowed Origin (status ${res.status}). DNS rebinding risk.`,
      evidence: { expected: '403 or 400', actual: { status: res.status } },
    }
  },
}
export default check
```

- [ ] **Step 2: Implement S-04 tls-required**

```ts
// argus/lib/conformance/checks/security/S-04.tls-required/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'S-04', category: 'security', severity: 'warning', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Non-loopback endpoints use HTTPS',
  probe: 'Inspect endpoint URL: if host is non-loopback, scheme must be https.',
  criterion: 'Public servers MUST use TLS. Loopback (127.0.0.1, ::1, localhost) is exempt.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices',
    section: 'Transport security',
    quote: 'Production deployments MUST use TLS for non-loopback endpoints.',
  },
  deterministic: true,
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'S-04', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }
    const u = new URL(ctx.transport.url!)
    const loopback = ['127.0.0.1', '::1', 'localhost'].includes(u.hostname)
    if (loopback) {
      return { checkId: 'S-04', status: 'skip', durationMs: 0, message: 'Loopback exempt from TLS requirement.' }
    }
    if (u.protocol === 'https:') {
      return { checkId: 'S-04', status: 'pass', durationMs: 0, evidence: { actual: u.protocol } }
    }
    return {
      checkId: 'S-04', status: 'fail', durationMs: 0,
      message: `Non-loopback endpoint using ${u.protocol} (must be https:).`,
      evidence: { expected: 'https:', actual: u.protocol },
    }
  },
}
export default check
```

- [ ] **Step 3: Register, test, commit**

```ts
registerChecks(S01, S04)
```

```bash
cd argus && pnpm test tests/unit/conformance/checks/security.test.ts -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/security argus/tests/unit/conformance/checks/security.test.ts argus/lib/conformance/registry.ts && git commit -m "feat(argus): add Security checks S-01, S-04"
```

---

### Task 35: Tasks checks

**Files:**
- Create: `argus/lib/conformance/checks/tasks/TK-01.task-support-declared/check.ts`
- Create: `argus/lib/conformance/checks/tasks/TK-02.task-status-poll/check.ts`
- Test: `argus/tests/unit/conformance/checks/tasks.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

Spec base URL: `https://modelcontextprotocol.io/specification/2025-11-25/server/tools#tasks`

- [ ] **Step 1: Implement TK-01 task-support-declared**

```ts
// argus/lib/conformance/checks/tasks/TK-01.task-support-declared/check.ts
import type { Check } from '../../../types'

const ALLOWED = ['forbidden', 'optional', 'required'] as const

const check: Check = {
  id: 'TK-01', category: 'tasks', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'execution.taskSupport (if present) is forbidden|optional|required',
  probe: 'Inspect every tool with execution.taskSupport set.',
  criterion: 'Value MUST be one of the three enum constants.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools#tasks',
    section: 'Task support',
    quote: 'execution.taskSupport: "forbidden" | "optional" | "required".',
  },
  requires: { capability: 'tools' },
  deterministic: true,
  async run(ctx) {
    const { result, raw } = await ctx.client.call('tools/list', {})
    const tools = (result as any)?.tools ?? []
    const bad: any[] = []
    for (const t of tools) {
      const v = t?.execution?.taskSupport
      if (v !== undefined && !ALLOWED.includes(v)) bad.push({ tool: t.name, value: v })
    }
    if (bad.length === 0) {
      return { checkId: 'TK-01', status: 'pass', durationMs: 0, evidence: { response: raw } }
    }
    return {
      checkId: 'TK-01', status: 'fail', durationMs: 0,
      message: `${bad.length} tool(s) with invalid taskSupport value.`,
      evidence: { actual: bad, expected: 'forbidden|optional|required' },
    }
  },
}
export default check
```

- [ ] **Step 2: Implement TK-02 task-status-poll**

```ts
// argus/lib/conformance/checks/tasks/TK-02.task-status-poll/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'TK-02', category: 'tasks', severity: 'warning', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'tasks/status returns running → completed for in-flight task',
  probe: 'Call __torture/slow-tool as background task via tasks/create; poll tasks/status; expect terminal status.',
  criterion: 'Status field transitions from running to completed/failed.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools#tasks',
    section: 'tasks/status',
    quote: 'Status values: running, completed, failed, cancelled.',
  },
  requires: { tool: '__torture/slow-tool' },
  deterministic: false,
  async run(ctx) {
    const create = await ctx.client.call('tasks/create', {
      method: 'tools/call',
      params: { name: '__torture/slow-tool', arguments: { delayMs: 500 } },
    })
    const taskId = (create.result as any)?.taskId
    if (!taskId) {
      return { checkId: 'TK-02', status: 'skip', durationMs: 0, message: 'Server does not support tasks/create.' }
    }
    for (let i = 0; i < 20; i++) {
      const s = await ctx.client.call('tasks/status', { taskId })
      const status = (s.result as any)?.status
      if (['completed', 'failed', 'cancelled'].includes(status)) {
        return { checkId: 'TK-02', status: 'pass', durationMs: 0, evidence: { actual: status } }
      }
      await new Promise((r) => setTimeout(r, 200))
    }
    return {
      checkId: 'TK-02', status: 'fail', durationMs: 0,
      message: 'Task never reached terminal status within 4s.',
      evidence: { expected: 'completed|failed|cancelled', actual: 'timeout' },
    }
  },
}
export default check
```

- [ ] **Step 3: Register, test, commit**

```ts
registerChecks(TK01, TK02)
```

```bash
cd argus && pnpm test tests/unit/conformance/checks/tasks.test.ts -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/tasks argus/tests/unit/conformance/checks/tasks.test.ts argus/lib/conformance/registry.ts torture-server/src/index.ts && git commit -m "feat(argus): add Tasks checks TK-01, TK-02"
```

---

### Task 36: Hygiene checks

**Files:**
- Create: `argus/lib/conformance/checks/hygiene/H-01.error-messages-helpful/check.ts`
- Create: `argus/lib/conformance/checks/hygiene/H-02.consistent-types/check.ts`
- Create: `argus/lib/conformance/checks/hygiene/H-08.no-stack-traces/check.ts`
- Test: `argus/tests/unit/conformance/checks/hygiene.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

- [ ] **Step 1: Implement H-01 error-messages-helpful**

```ts
// argus/lib/conformance/checks/hygiene/H-01.error-messages-helpful/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'H-01', category: 'hygiene', severity: 'warning', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Error messages are non-empty and informative',
  probe: 'Trigger a known error (unknown method); inspect error.message.',
  criterion: 'message SHOULD be a non-trivial string (≥5 chars, not just code number).',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: 'Error reporting hygiene',
    quote: 'Implementations SHOULD provide human-readable error messages.',
  },
  deterministic: true,
  async run(ctx) {
    const { error, raw } = await ctx.client.call('nonexistent/method', {})
    const msg = error?.message ?? ''
    if (msg.length >= 5 && !/^-?\d+$/.test(msg)) {
      return { checkId: 'H-01', status: 'pass', durationMs: 0, evidence: { actual: msg } }
    }
    return {
      checkId: 'H-01', status: 'fail', durationMs: 0,
      message: `Error message too short or numeric-only: "${msg}".`,
      evidence: { response: raw, expected: 'human-readable string ≥5 chars' },
    }
  },
}
export default check
```

- [ ] **Step 2: Implement H-02 consistent-types**

```ts
// argus/lib/conformance/checks/hygiene/H-02.consistent-types/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'H-02', category: 'hygiene', severity: 'warning', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Same field has same type across responses',
  probe: 'Call tools/list twice; verify each tool entry has identical field types.',
  criterion: 'Field types MUST be stable across repeated calls.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'Stable typing',
    quote: 'Response shapes SHOULD be consistent across calls.',
  },
  requires: { capability: 'tools' },
  deterministic: true,
  async run(ctx) {
    const a = await ctx.client.call('tools/list', {})
    const b = await ctx.client.call('tools/list', {})
    const ta = ((a.result as any)?.tools ?? [])[0]
    const tb = ((b.result as any)?.tools ?? [])[0]
    if (!ta || !tb) {
      return { checkId: 'H-02', status: 'skip', durationMs: 0, message: 'No tools to compare.' }
    }
    const drift: string[] = []
    for (const k of Object.keys(ta)) {
      if (typeof ta[k] !== typeof tb[k]) drift.push(`${k}: ${typeof ta[k]} → ${typeof tb[k]}`)
    }
    if (drift.length === 0) {
      return { checkId: 'H-02', status: 'pass', durationMs: 0, evidence: { actual: 'stable' } }
    }
    return {
      checkId: 'H-02', status: 'fail', durationMs: 0,
      message: `Field type drift: ${drift.join(', ')}.`,
      evidence: { actual: drift, expected: 'stable types' },
    }
  },
}
export default check
```

- [ ] **Step 3: Implement H-08 no-stack-traces**

```ts
// argus/lib/conformance/checks/hygiene/H-08.no-stack-traces/check.ts
import type { Check } from '../../../types'

const STACK_RE = /\n\s+at\s+|Traceback \(most recent|panic:\s+|goroutine \d+ \[/

const check: Check = {
  id: 'H-08', category: 'hygiene', severity: 'warning', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Error messages do not leak stack traces',
  probe: 'Trigger known error paths and grep error.message for stack-trace patterns.',
  criterion: 'Production errors SHOULD NOT include raw stack traces (info disclosure risk).',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices',
    section: 'Information disclosure',
    quote: 'Servers SHOULD NOT expose internal stack traces or paths in error messages.',
  },
  deterministic: true,
  async run(ctx) {
    const probes = [
      () => ctx.client.call('nonexistent/method', {}),
      () => ctx.client.call('tools/call', { name: '__torture/throw', arguments: {} }),
    ]
    const leaks: string[] = []
    for (const p of probes) {
      const { error, result } = await p()
      const text = JSON.stringify({ error, result } ?? {})
      if (STACK_RE.test(text)) leaks.push(text.slice(0, 200))
    }
    if (leaks.length === 0) {
      return { checkId: 'H-08', status: 'pass', durationMs: 0, evidence: { actual: 'clean' } }
    }
    return {
      checkId: 'H-08', status: 'fail', durationMs: 0,
      message: `Stack trace leaked in ${leaks.length} response(s).`,
      evidence: { actual: leaks },
    }
  },
}
export default check
```

- [ ] **Step 4: Register, test, commit**

```ts
registerChecks(H01, H02, H08)
```

```bash
cd argus && pnpm test tests/unit/conformance/checks/hygiene.test.ts -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/hygiene argus/tests/unit/conformance/checks/hygiene.test.ts argus/lib/conformance/registry.ts torture-server/src/index.ts && git commit -m "feat(argus): add Hygiene checks H-01, H-02, H-08"
```

---

### Task 37: RC (release candidate) checks

**Files:**
- Create: `argus/lib/conformance/checks/rc/RC-01.draft-2026-v1-supported/check.ts`
- Create: `argus/lib/conformance/checks/rc/RC-02.icons-typed/check.ts`
- Create: `argus/lib/conformance/checks/rc/RC-03.url-mode-elicitation/check.ts`
- Test: `argus/tests/unit/conformance/checks/rc.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

Spec base URL: `https://modelcontextprotocol.io/specification/draft-2026-v1`

- [ ] **Step 1: Implement RC-01 draft-2026-v1-supported**

```ts
// argus/lib/conformance/checks/rc/RC-01.draft-2026-v1-supported/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'RC-01', category: 'rc', severity: 'warning', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1'],
  title: 'Server initializes with protocolVersion DRAFT-2026-v1',
  probe: 'initialize({ protocolVersion: "DRAFT-2026-v1" }); inspect echoed version.',
  criterion: 'Echoed protocolVersion MUST be `DRAFT-2026-v1`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/draft-2026-v1',
    section: 'Draft 2026 v1',
    quote: 'protocolVersion = "DRAFT-2026-v1"',
  },
  deterministic: true,
  async run(ctx) {
    const init: any = await ctx.client.initialize()
    if (init.protocolVersion === 'DRAFT-2026-v1') {
      return { checkId: 'RC-01', status: 'pass', durationMs: 0, evidence: { response: init } }
    }
    return {
      checkId: 'RC-01', status: 'fail', durationMs: 0,
      message: `Expected DRAFT-2026-v1, got ${init.protocolVersion}.`,
      evidence: { expected: 'DRAFT-2026-v1', actual: init.protocolVersion },
    }
  },
}
export default check
```

- [ ] **Step 2: Implement RC-02 icons-typed**

```ts
// argus/lib/conformance/checks/rc/RC-02.icons-typed/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'RC-02', category: 'rc', severity: 'warning', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1'],
  title: 'serverInfo.icons (if present) is array of { url, sizes? } entries',
  probe: 'Inspect serverInfo.icons for correct shape.',
  criterion: 'icons MUST be an array of objects with string `url` and optional string `sizes`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/draft-2026-v1',
    section: 'serverInfo.icons',
    quote: 'icons: array of { url: string, sizes?: string }.',
  },
  deterministic: true,
  async run(ctx) {
    const init: any = await ctx.client.initialize()
    const icons = init.serverInfo?.icons
    if (icons === undefined) {
      return { checkId: 'RC-02', status: 'skip', durationMs: 0, message: 'No icons declared.' }
    }
    if (!Array.isArray(icons)) {
      return {
        checkId: 'RC-02', status: 'fail', durationMs: 0,
        message: 'icons is not an array.',
        evidence: { actual: typeof icons },
      }
    }
    const bad = icons.filter((i: any) =>
      typeof i?.url !== 'string' || ('sizes' in i && typeof i.sizes !== 'string'),
    )
    if (bad.length === 0) {
      return { checkId: 'RC-02', status: 'pass', durationMs: 0, evidence: { response: init } }
    }
    return {
      checkId: 'RC-02', status: 'fail', durationMs: 0,
      message: `${bad.length} icon entries malformed.`,
      evidence: { actual: bad, expected: '{ url: string, sizes?: string }' },
    }
  },
}
export default check
```

- [ ] **Step 3: Implement RC-03 url-mode-elicitation**

```ts
// argus/lib/conformance/checks/rc/RC-03.url-mode-elicitation/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'RC-03', category: 'rc', severity: 'warning', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1'],
  title: 'URL-mode elicitation request has https URL',
  probe: 'Call __torture/elicitation-url-probe; verify request.params.url is HTTPS.',
  criterion: 'When elicitation/create uses URL mode, url MUST be https:// (not data:, javascript:, http:).',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/draft-2026-v1',
    section: 'URL-mode elicitation',
    quote: 'URL-mode elicitation request: url MUST be https.',
  },
  requires: { tool: '__torture/elicitation-url-probe' },
  deterministic: false,
  async run(ctx) {
    const captured: any[] = []
    ctx.client.onRequest((req) => {
      if (req.method === 'elicitation/create') captured.push(req)
      return { action: 'cancel' }
    })
    await ctx.client.call('tools/call', { name: '__torture/elicitation-url-probe', arguments: {} })
    if (captured.length === 0) {
      return { checkId: 'RC-03', status: 'skip', durationMs: 0, message: 'No URL elicitation observed.' }
    }
    const url = captured[0]?.params?.url
    if (typeof url === 'string' && /^https:\/\//.test(url)) {
      return { checkId: 'RC-03', status: 'pass', durationMs: 0, evidence: { actual: url } }
    }
    return {
      checkId: 'RC-03', status: 'fail', durationMs: 0,
      message: `URL-mode elicitation url is "${url}" (must be https://).`,
      evidence: { expected: 'https://...', actual: url },
    }
  },
}
export default check
```

- [ ] **Step 4: Register, test, commit**

```ts
registerChecks(RC01, RC02, RC03)
```

```bash
cd argus && pnpm test tests/unit/conformance/checks/rc.test.ts -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/rc argus/tests/unit/conformance/checks/rc.test.ts argus/lib/conformance/registry.ts torture-server/src/index.ts && git commit -m "feat(argus): add RC checks RC-01, RC-02, RC-03"
```

---

### Task 38: Discovery checks

**Files:**
- Create: `argus/lib/conformance/checks/discovery/DISC-01.well-known-mcp/check.ts`
- Create: `argus/lib/conformance/checks/discovery/DISC-02.cors-preflight/check.ts`
- Test: `argus/tests/unit/conformance/checks/discovery.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

- [ ] **Step 1: Implement DISC-01 well-known-mcp**

```ts
// argus/lib/conformance/checks/discovery/DISC-01.well-known-mcp/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'DISC-01', category: 'discovery', severity: 'warning', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: '/.well-known/mcp returns valid discovery document',
  probe: 'GET <origin>/.well-known/mcp; expect JSON with `endpoint`, `transports`, `protocolVersions`.',
  criterion: 'Document MUST be valid JSON with required discovery fields.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: 'Discovery',
    quote: 'Servers SHOULD publish a discovery document at /.well-known/mcp.',
  },
  deterministic: true,
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'DISC-01', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }
    const u = new URL(ctx.transport.url!)
    const discoveryUrl = `${u.origin}/.well-known/mcp`
    const res = await fetch(discoveryUrl)
    if (!res.ok) {
      return {
        checkId: 'DISC-01', status: 'fail', durationMs: 0,
        message: `Discovery document returned HTTP ${res.status}.`,
        evidence: { actual: { status: res.status, url: discoveryUrl } },
      }
    }
    const body = await res.json().catch(() => null)
    const ok = body
      && typeof body.endpoint === 'string'
      && Array.isArray(body.transports)
      && Array.isArray(body.protocolVersions)
    if (ok) {
      return { checkId: 'DISC-01', status: 'pass', durationMs: 0, evidence: { response: body } }
    }
    return {
      checkId: 'DISC-01', status: 'fail', durationMs: 0,
      message: 'Discovery document missing required fields.',
      evidence: { expected: '{ endpoint, transports[], protocolVersions[] }', actual: body },
    }
  },
}
export default check
```

- [ ] **Step 2: Implement DISC-02 cors-preflight**

```ts
// argus/lib/conformance/checks/discovery/DISC-02.cors-preflight/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'DISC-02', category: 'discovery', severity: 'warning', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'OPTIONS preflight allows POST + Content-Type + MCP-Protocol-Version',
  probe: 'Send OPTIONS with Access-Control-Request-* headers; inspect response.',
  criterion: 'Server MUST return Access-Control-Allow-Methods including POST and Allow-Headers including Content-Type, MCP-Protocol-Version.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: 'CORS',
    quote: 'Servers MUST handle CORS preflight requests for browser clients.',
  },
  deterministic: true,
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'DISC-02', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }
    const res = await fetch(ctx.transport.url!, {
      method: 'OPTIONS',
      headers: {
        Origin: 'https://argus.local',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type, mcp-protocol-version',
      },
    })
    const allowMethods = (res.headers.get('access-control-allow-methods') ?? '').toLowerCase()
    const allowHeaders = (res.headers.get('access-control-allow-headers') ?? '').toLowerCase()
    const ok =
      allowMethods.includes('post')
      && allowHeaders.includes('content-type')
      && allowHeaders.includes('mcp-protocol-version')
    if (ok) {
      return { checkId: 'DISC-02', status: 'pass', durationMs: 0, evidence: { actual: { allowMethods, allowHeaders } } }
    }
    return {
      checkId: 'DISC-02', status: 'fail', durationMs: 0,
      message: 'CORS preflight missing required Allow-Methods or Allow-Headers.',
      evidence: { expected: 'POST + content-type + mcp-protocol-version', actual: { allowMethods, allowHeaders } },
    }
  },
}
export default check
```

- [ ] **Step 3: Register, test, commit**

```ts
registerChecks(DISC01, DISC02)
```

```bash
cd argus && pnpm test tests/unit/conformance/checks/discovery.test.ts -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/discovery argus/tests/unit/conformance/checks/discovery.test.ts argus/lib/conformance/registry.ts torture-server/src/index.ts && git commit -m "feat(argus): add Discovery checks DISC-01, DISC-02"
```

---

### Task 39: Stateless checks

**Files:**
- Create: `argus/lib/conformance/checks/stateless/SL-01.no-session-cookie/check.ts`
- Create: `argus/lib/conformance/checks/stateless/SL-02.identical-result-after-reconnect/check.ts`
- Test: `argus/tests/unit/conformance/checks/stateless.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

- [ ] **Step 1: Implement SL-01 no-session-cookie**

```ts
// argus/lib/conformance/checks/stateless/SL-01.no-session-cookie/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'SL-01', category: 'stateless', severity: 'warning', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Server does not require session cookies',
  probe: 'POST initialize; check response for Set-Cookie or session-binding headers.',
  criterion: 'MCP servers SHOULD be stateless; session cookies indicate transport coupling.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: 'Statelessness',
    quote: 'Streamable HTTP servers SHOULD be stateless and not rely on session cookies.',
  },
  deterministic: true,
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'SL-01', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }
    const res = await fetch(ctx.transport.url!, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'MCP-Protocol-Version': ctx.spec },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
    })
    const cookie = res.headers.get('set-cookie')
    if (!cookie) {
      return { checkId: 'SL-01', status: 'pass', durationMs: 0, evidence: { actual: 'no Set-Cookie' } }
    }
    return {
      checkId: 'SL-01', status: 'fail', durationMs: 0,
      message: `Server set cookie: "${cookie.slice(0, 80)}".`,
      evidence: { expected: 'no Set-Cookie', actual: cookie },
    }
  },
}
export default check
```

- [ ] **Step 2: Implement SL-02 identical-result-after-reconnect**

```ts
// argus/lib/conformance/checks/stateless/SL-02.identical-result-after-reconnect/check.ts
import type { Check } from '../../../types'
import { createMcpClient } from '../../../client'
import { createRawHttpClient } from '../../../transport/raw'
import { createHttpTransport } from '../../../transport/http'

const check: Check = {
  id: 'SL-02', category: 'stateless', severity: 'warning', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'tools/list result identical when called from a fresh connection',
  probe: 'Call tools/list; tear down client; create fresh client; call tools/list again. Compare results.',
  criterion: 'Tool list MUST NOT depend on prior connection state.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: 'Statelessness',
    quote: 'Responses to identical requests SHOULD be independent of session history.',
  },
  requires: { capability: 'tools' },
  deterministic: true,
  async run(ctx) {
    const a = await ctx.client.call('tools/list', {})
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'SL-02', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }
    const url = ctx.transport.url!
    const rawHttp = createRawHttpClient({ url })
    const transport = createHttpTransport({ url, spec: ctx.spec, rawHttp })
    const fresh = createMcpClient(transport, ctx.spec, url)
    await fresh.initialize()
    const b = await fresh.call('tools/list', {})
    const ja = JSON.stringify((a.result as any)?.tools)
    const jb = JSON.stringify((b.result as any)?.tools)
    if (ja === jb) {
      return { checkId: 'SL-02', status: 'pass', durationMs: 0, evidence: { actual: 'identical' } }
    }
    return {
      checkId: 'SL-02', status: 'fail', durationMs: 0,
      message: 'tools/list differed between original and fresh connection.',
      evidence: { expected: 'identical results', actual: { first: ja.slice(0, 200), second: jb.slice(0, 200) } },
    }
  },
}
export default check
```

- [ ] **Step 3: Register, test, commit**

```ts
registerChecks(SL01, SL02)
```

```bash
cd argus && pnpm test tests/unit/conformance/checks/stateless.test.ts -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/stateless argus/tests/unit/conformance/checks/stateless.test.ts argus/lib/conformance/registry.ts && git commit -m "feat(argus): add Stateless checks SL-01, SL-02"
```

---

### Task 40: Subscriptions checks

**Files:**
- Create: `argus/lib/conformance/checks/subscriptions/SUB-01.resource-subscribe/check.ts`
- Create: `argus/lib/conformance/checks/subscriptions/SUB-02.unsubscribe-stops-events/check.ts`
- Test: `argus/tests/unit/conformance/checks/subscriptions.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

- [ ] **Step 1: Implement SUB-01 resource-subscribe**

```ts
// argus/lib/conformance/checks/subscriptions/SUB-01.resource-subscribe/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'SUB-01', category: 'subscriptions', severity: 'warning', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'resources/subscribe yields notifications/resources/updated',
  probe: 'Subscribe to __torture/resource; trigger update; expect notification.',
  criterion: 'After resources/subscribe, server MUST emit notifications/resources/updated on change.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/resources',
    section: 'resources/subscribe',
    quote: 'After subscription, the server emits notifications/resources/updated when the resource changes.',
  },
  requires: { capability: 'resources' },
  deterministic: false,
  async run(ctx) {
    const uri = 'argus://torture/dynamic'
    const events: any[] = []
    ctx.client.onNotification((n) => {
      if (n.method === 'notifications/resources/updated' && n.params?.uri === uri) events.push(n)
    })
    const sub = await ctx.client.call('resources/subscribe', { uri })
    if (sub.error) {
      return { checkId: 'SUB-01', status: 'skip', durationMs: 0, message: 'Server does not support subscribe.' }
    }
    await ctx.client.call('tools/call', { name: '__torture/touch-resource', arguments: { uri } })
    await new Promise((r) => setTimeout(r, 500))
    if (events.length > 0) {
      return { checkId: 'SUB-01', status: 'pass', durationMs: 0, evidence: { actual: `${events.length} updates` } }
    }
    return {
      checkId: 'SUB-01', status: 'fail', durationMs: 0,
      message: 'No resources/updated notification observed within 500ms.',
      evidence: { expected: '≥1 update', actual: 0 },
    }
  },
}
export default check
```

- [ ] **Step 2: Implement SUB-02 unsubscribe-stops-events**

```ts
// argus/lib/conformance/checks/subscriptions/SUB-02.unsubscribe-stops-events/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'SUB-02', category: 'subscriptions', severity: 'warning', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'resources/unsubscribe stops further notifications',
  probe: 'Subscribe → unsubscribe → trigger update → expect no notification.',
  criterion: 'After unsubscribe, server MUST NOT emit further notifications for that resource.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/resources',
    section: 'resources/unsubscribe',
    quote: 'After unsubscribe, no further notifications/resources/updated SHALL be sent.',
  },
  requires: { capability: 'resources' },
  deterministic: false,
  async run(ctx) {
    const uri = 'argus://torture/dynamic'
    await ctx.client.call('resources/subscribe', { uri })
    const unsub = await ctx.client.call('resources/unsubscribe', { uri })
    if (unsub.error) {
      return { checkId: 'SUB-02', status: 'skip', durationMs: 0, message: 'unsubscribe not supported.' }
    }
    const after: any[] = []
    ctx.client.onNotification((n) => {
      if (n.method === 'notifications/resources/updated' && n.params?.uri === uri) after.push(n)
    })
    await ctx.client.call('tools/call', { name: '__torture/touch-resource', arguments: { uri } })
    await new Promise((r) => setTimeout(r, 500))
    if (after.length === 0) {
      return { checkId: 'SUB-02', status: 'pass', durationMs: 0, evidence: { actual: 'silenced' } }
    }
    return {
      checkId: 'SUB-02', status: 'fail', durationMs: 0,
      message: `Received ${after.length} notification(s) after unsubscribe.`,
      evidence: { expected: 0, actual: after.length },
    }
  },
}
export default check
```

- [ ] **Step 3: Register, test, commit**

```ts
registerChecks(SUB01, SUB02)
```

```bash
cd argus && pnpm test tests/unit/conformance/checks/subscriptions.test.ts -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/subscriptions argus/tests/unit/conformance/checks/subscriptions.test.ts argus/lib/conformance/registry.ts torture-server/src/index.ts && git commit -m "feat(argus): add Subscriptions checks SUB-01, SUB-02"
```

---

### Task 41: Caching and MRTR checks

**Files:**
- Create: `argus/lib/conformance/checks/caching/CACHE-01.list-stable-without-changed/check.ts`
- Create: `argus/lib/conformance/checks/caching/CACHE-05.list-changed-after-touch/check.ts`
- Create: `argus/lib/conformance/checks/mrtr/MRTR-01.metadata-shape/check.ts`
- Create: `argus/lib/conformance/checks/mrtr/MRTR-03.transport-spec/check.ts`
- Test: `argus/tests/unit/conformance/checks/caching.test.ts`
- Test: `argus/tests/unit/conformance/checks/mrtr.test.ts`
- Modify: `argus/lib/conformance/registry.ts`

- [ ] **Step 1: Implement CACHE-01 list-stable-without-changed**

```ts
// argus/lib/conformance/checks/caching/CACHE-01.list-stable-without-changed/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'CACHE-01', category: 'caching', severity: 'warning', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'tools/list result is byte-stable when no listChanged event',
  probe: 'Call tools/list twice quickly; verify identical JSON-stringified result.',
  criterion: 'In the absence of list_changed notifications, tools/list responses MUST be identical.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'Caching guidance',
    quote: 'Clients may cache tools/list until receiving notifications/tools/list_changed.',
  },
  requires: { capability: 'tools' },
  deterministic: true,
  async run(ctx) {
    const a = await ctx.client.call('tools/list', {})
    const b = await ctx.client.call('tools/list', {})
    if (JSON.stringify(a.result) === JSON.stringify(b.result)) {
      return { checkId: 'CACHE-01', status: 'pass', durationMs: 0, evidence: { actual: 'stable' } }
    }
    return {
      checkId: 'CACHE-01', status: 'fail', durationMs: 0,
      message: 'tools/list differed between consecutive calls.',
      evidence: { expected: 'identical', actual: { first: a.result, second: b.result } },
    }
  },
}
export default check
```

- [ ] **Step 2: Implement CACHE-05 list-changed-after-touch**

```ts
// argus/lib/conformance/checks/caching/CACHE-05.list-changed-after-touch/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'CACHE-05', category: 'caching', severity: 'warning', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'After __torture/touch-tools, notifications/tools/list_changed fires',
  probe: 'Subscribe to list_changed notifications; call __torture/touch-tools; expect notification.',
  criterion: 'When tool set changes, server MUST emit notifications/tools/list_changed.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'list_changed',
    quote: 'On tool list change, server emits notifications/tools/list_changed.',
  },
  requires: { capability: 'tools' },
  deterministic: false,
  async run(ctx) {
    const events: any[] = []
    ctx.client.onNotification((n) => {
      if (n.method === 'notifications/tools/list_changed') events.push(n)
    })
    const touch = await ctx.client.call('tools/call', { name: '__torture/touch-tools', arguments: {} })
    if (touch.error) {
      return { checkId: 'CACHE-05', status: 'skip', durationMs: 0, message: 'No touch-tools probe.' }
    }
    await new Promise((r) => setTimeout(r, 500))
    if (events.length > 0) {
      return { checkId: 'CACHE-05', status: 'pass', durationMs: 0, evidence: { actual: events.length } }
    }
    return {
      checkId: 'CACHE-05', status: 'fail', durationMs: 0,
      message: 'No list_changed notification after tool set mutation.',
      evidence: { expected: '≥1 list_changed', actual: 0 },
    }
  },
}
export default check
```

- [ ] **Step 3: Implement MRTR-01 metadata-shape**

```ts
// argus/lib/conformance/checks/mrtr/MRTR-01.metadata-shape/check.ts
import type { Check } from '../../../types'

const check: Check = {
  id: 'MRTR-01', category: 'mrtr', severity: 'warning', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1'],
  title: 'Multi-resource transport metadata has expected shape',
  probe: 'If server declares multi-resource transport routing, inspect metadata.',
  criterion: 'mrtr metadata MUST include `resources[]` and `routes[]` arrays.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/draft-2026-v1',
    section: 'Multi-resource transport routing',
    quote: 'MRTR servers expose resources[] and routes[] in their metadata.',
  },
  deterministic: true,
  async run(ctx) {
    const mrtr = (ctx.serverInfo as any)?.mrtr
    if (!mrtr) {
      return { checkId: 'MRTR-01', status: 'skip', durationMs: 0, message: 'No MRTR metadata declared.' }
    }
    const ok = Array.isArray(mrtr.resources) && Array.isArray(mrtr.routes)
    if (ok) {
      return { checkId: 'MRTR-01', status: 'pass', durationMs: 0, evidence: { response: mrtr } }
    }
    return {
      checkId: 'MRTR-01', status: 'fail', durationMs: 0,
      message: 'MRTR metadata missing resources[] or routes[].',
      evidence: { expected: '{ resources[], routes[] }', actual: mrtr },
    }
  },
}
export default check
```

- [ ] **Step 4: Implement MRTR-03 transport-spec**

```ts
// argus/lib/conformance/checks/mrtr/MRTR-03.transport-spec/check.ts
import type { Check } from '../../../types'

const ALLOWED = ['http', 'sse', 'stdio'] as const

const check: Check = {
  id: 'MRTR-03', category: 'mrtr', severity: 'warning', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1'],
  title: 'MRTR routes use only allowed transport identifiers',
  probe: 'Inspect each route.transport for allowed values.',
  criterion: 'Each route.transport MUST be `http`, `sse`, or `stdio`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/draft-2026-v1',
    section: 'MRTR routes',
    quote: 'route.transport: http | sse | stdio.',
  },
  deterministic: true,
  async run(ctx) {
    const mrtr = (ctx.serverInfo as any)?.mrtr
    if (!mrtr?.routes) {
      return { checkId: 'MRTR-03', status: 'skip', durationMs: 0, message: 'No MRTR routes.' }
    }
    const bad = mrtr.routes.filter((r: any) => !ALLOWED.includes(r?.transport))
    if (bad.length === 0) {
      return { checkId: 'MRTR-03', status: 'pass', durationMs: 0, evidence: { response: mrtr.routes } }
    }
    return {
      checkId: 'MRTR-03', status: 'fail', durationMs: 0,
      message: `${bad.length} route(s) with disallowed transport.`,
      evidence: { actual: bad, expected: ALLOWED.join('|') },
    }
  },
}
export default check
```

- [ ] **Step 5: Register, test, commit**

```ts
registerChecks(CACHE01, CACHE05, MRTR01, MRTR03)
```

```bash
cd argus && pnpm test tests/unit/conformance/checks/caching.test.ts tests/unit/conformance/checks/mrtr.test.ts -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/checks/caching argus/lib/conformance/checks/mrtr argus/tests/unit/conformance/checks/caching.test.ts argus/tests/unit/conformance/checks/mrtr.test.ts argus/lib/conformance/registry.ts torture-server/src/index.ts && git commit -m "feat(argus): add Caching and MRTR checks"
```

---

## Group I — UI surfaces

### Task 42: Result adapter (engine result → store CheckResult)

**Files:**
- Create: `argus/lib/conformance/adapter.ts`
- Test: `argus/tests/unit/conformance/adapter.test.ts`

Engine `Severity` is `'error' | 'warning' | 'info'`. Store `Severity` is `'critical' | 'major' | 'minor' | 'info'`. Engine `Confidence` does not exist in store. Need an explicit adapter.

- [ ] **Step 1: Write failing test**

```ts
// argus/tests/unit/conformance/adapter.test.ts
import { describe, it, expect } from 'vitest'
import { toStoreResult } from '@/lib/conformance/adapter'
import type { CheckResult as EngineCheckResult, Check } from '@/lib/conformance/types'

const engineCheck: Check = {
  id: 'T-07', category: 'transport', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1'], title: 'Origin validation', probe: '', criterion: '',
  specRef: { url: 'https://x', section: 's', quote: 'q' },
  deterministic: true, async run() { throw new Error('n/a') },
}

const engineResult: EngineCheckResult = {
  checkId: 'T-07', status: 'fail', durationMs: 12,
  message: 'Server accepted disallowed Origin',
  evidence: { expected: '403', actual: { status: 200 } },
}

describe('toStoreResult', () => {
  it('maps engine severity error → major', () => {
    const r = toStoreResult(engineResult, engineCheck)
    expect(r.severity).toBe('major')
  })
  it('carries observed/expected/specRef/fixHint into store shape', () => {
    const r = toStoreResult(engineResult, engineCheck)
    expect(r.observed).toContain('200')
    expect(r.expected).toBe('403')
    expect(r.specRef).toBe('https://x')
  })
  it('preserves pass and durationMs', () => {
    const r = toStoreResult({ ...engineResult, status: 'pass', durationMs: 5 }, engineCheck)
    expect(r.status).toBe('pass')
    expect(r.durationMs).toBe(5)
  })
})
```

- [ ] **Step 2: Run test, expect FAIL**

Run: `cd argus && pnpm test tests/unit/conformance/adapter.test.ts -- --run`

- [ ] **Step 3: Implement adapter**

```ts
// argus/lib/conformance/adapter.ts
import type { CheckResult as EngineCheckResult, Check } from './types'
import type { CheckResult as StoreCheckResult, Severity as StoreSeverity } from '@/lib/store/types'

const SEVERITY_MAP: Record<Check['severity'], StoreSeverity> = {
  error: 'major',
  warning: 'minor',
  info: 'info',
}

function stringifyActual(v: unknown): string {
  if (v === undefined || v === null) return ''
  if (typeof v === 'string') return v
  return JSON.stringify(v)
}

export function toStoreResult(result: EngineCheckResult, check: Check): StoreCheckResult {
  return {
    checkId: result.checkId,
    category: check.category,
    severity: SEVERITY_MAP[check.severity],
    status: result.status,
    durationMs: result.durationMs,
    observed: result.message ?? stringifyActual(result.evidence?.actual),
    expected: stringifyActual(result.evidence?.expected),
    specRef: check.specRef.url,
    fixHint: result.evidence?.notes,
  }
}
```

- [ ] **Step 4: Run test, expect PASS**

Run: `cd argus && pnpm test tests/unit/conformance/adapter.test.ts -- --run`

- [ ] **Step 5: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/lib/conformance/adapter.ts argus/tests/unit/conformance/adapter.test.ts && git commit -m "feat(argus): add engine-to-store result adapter"
```

---

### Task 43: ScanComposer component

**Files:**
- Create: `argus/components/test/ScanComposer.tsx`
- Create: `argus/components/test/ScanComposer.module.css`
- Test: `argus/tests/unit/test/ScanComposer.test.tsx`

Composer collects endpoint URL, transport choice, spec version, optional proxy URL, optional bridge URL, optional bearer header, then dispatches a scan via `onStart(cfg)`.

- [ ] **Step 1: Write failing test**

```tsx
// argus/tests/unit/test/ScanComposer.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ScanComposer } from '@/components/test/ScanComposer'

describe('ScanComposer', () => {
  it('renders endpoint + transport + spec controls', () => {
    render(<ScanComposer onStart={() => {}} />)
    expect(screen.getByLabelText(/endpoint/i)).toBeTruthy()
    expect(screen.getByLabelText(/transport/i)).toBeTruthy()
    expect(screen.getByLabelText(/spec/i)).toBeTruthy()
  })

  it('start button passes config to onStart', () => {
    const onStart = vi.fn()
    render(<ScanComposer onStart={onStart} />)
    fireEvent.change(screen.getByLabelText(/endpoint/i), { target: { value: 'http://127.0.0.1:3845/mcp' } })
    fireEvent.click(screen.getByRole('button', { name: /run scan/i }))
    expect(onStart).toHaveBeenCalledWith(expect.objectContaining({
      endpoint: 'http://127.0.0.1:3845/mcp',
      transport: 'http',
      spec: 'DRAFT-2026-v1',
    }))
  })

  it('reveals bridge URL field when transport=stdio-ws', () => {
    render(<ScanComposer onStart={() => {}} />)
    fireEvent.change(screen.getByLabelText(/transport/i), { target: { value: 'stdio-ws' } })
    expect(screen.getByLabelText(/bridge url/i)).toBeTruthy()
    expect(screen.getByLabelText(/exec command/i)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Run, expect FAIL**

Run: `cd argus && pnpm test tests/unit/test/ScanComposer.test.tsx -- --run`

- [ ] **Step 3: Implement component**

```tsx
// argus/components/test/ScanComposer.tsx
'use client'

import { useState } from 'react'
import styles from './ScanComposer.module.css'
import { usePrefsStore } from '@/lib/store/prefs'
import type { SpecVersion } from '@/lib/conformance/types'

export type Transport = 'http' | 'sse' | 'stdio-ws'

export interface ScanConfig {
  endpoint: string
  transport: Transport
  spec: SpecVersion
  proxyUrl?: string
  bridgeUrl?: string
  bridgeCommand?: string
  bearerToken?: string
  authMode: 'none' | 'oauth-discovery'
}

interface Props {
  onStart: (cfg: ScanConfig) => void
}

export function ScanComposer({ onStart }: Props) {
  const recent = usePrefsStore((s) => s.recentEndpoints)
  const [endpoint, setEndpoint] = useState(recent[0] ?? '')
  const [transport, setTransport] = useState<Transport>('http')
  const [spec, setSpec] = useState<SpecVersion>('DRAFT-2026-v1')
  const [proxyUrl, setProxyUrl] = useState('')
  const [bridgeUrl, setBridgeUrl] = useState('ws://127.0.0.1:7879/bridge')
  const [bridgeCommand, setBridgeCommand] = useState('')
  const [bearer, setBearer] = useState('')
  const [authMode, setAuthMode] = useState<ScanConfig['authMode']>('none')

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!endpoint) return
    onStart({
      endpoint, transport, spec,
      proxyUrl: proxyUrl || undefined,
      bridgeUrl: transport === 'stdio-ws' ? bridgeUrl : undefined,
      bridgeCommand: transport === 'stdio-ws' ? bridgeCommand : undefined,
      bearerToken: bearer || undefined,
      authMode,
    })
  }

  return (
    <form className={styles.root} onSubmit={submit} data-argus="scan-composer">
      <label className={styles.field}>
        <span>Endpoint</span>
        <input
          aria-label="endpoint"
          list="recent-endpoints"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          placeholder="http://127.0.0.1:3845/mcp"
        />
        <datalist id="recent-endpoints">
          {recent.map((u) => <option key={u} value={u} />)}
        </datalist>
      </label>

      <label className={styles.field}>
        <span>Transport</span>
        <select
          aria-label="transport"
          value={transport}
          onChange={(e) => setTransport(e.target.value as Transport)}
        >
          <option value="http">streamable-http</option>
          <option value="sse">sse (legacy)</option>
          <option value="stdio-ws">stdio (via bridge)</option>
        </select>
      </label>

      <label className={styles.field}>
        <span>Spec</span>
        <select
          aria-label="spec"
          value={spec}
          onChange={(e) => setSpec(e.target.value as SpecVersion)}
        >
          <option value="DRAFT-2026-v1">DRAFT-2026-v1</option>
          <option value="2025-11-25">2025-11-25</option>
        </select>
      </label>

      <label className={styles.field}>
        <span>Proxy URL (optional, for cross-origin)</span>
        <input
          aria-label="proxy url"
          value={proxyUrl}
          onChange={(e) => setProxyUrl(e.target.value)}
          placeholder="http://127.0.0.1:7878/proxy"
        />
      </label>

      {transport === 'stdio-ws' && (
        <>
          <label className={styles.field}>
            <span>Bridge URL</span>
            <input
              aria-label="bridge url"
              value={bridgeUrl}
              onChange={(e) => setBridgeUrl(e.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>Exec command</span>
            <input
              aria-label="exec command"
              value={bridgeCommand}
              onChange={(e) => setBridgeCommand(e.target.value)}
              placeholder="npx -y @modelcontextprotocol/server-everything"
            />
          </label>
        </>
      )}

      <label className={styles.field}>
        <span>Bearer token (optional)</span>
        <input
          aria-label="bearer"
          type="password"
          value={bearer}
          onChange={(e) => setBearer(e.target.value)}
        />
      </label>

      <label className={styles.field}>
        <span>Auth mode</span>
        <select
          aria-label="auth mode"
          value={authMode}
          onChange={(e) => setAuthMode(e.target.value as any)}
        >
          <option value="none">none</option>
          <option value="oauth-discovery">oauth-discovery</option>
        </select>
      </label>

      <button type="submit" className={styles.run}>Run scan</button>
    </form>
  )
}
```

```css
/* argus/components/test/ScanComposer.module.css */
.root {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-3);
  padding: var(--space-4);
  font-family: var(--font-mono);
}
.field { display: grid; grid-template-columns: 200px 1fr; gap: var(--space-2); align-items: center; }
.field > span { color: var(--color-ink2); font-size: var(--text-xs); text-transform: uppercase; letter-spacing: 0.05em; }
.field > input, .field > select {
  background: var(--color-bg1); color: var(--color-ink0);
  border: 1px solid var(--color-grid); padding: var(--space-2);
  font-family: var(--font-mono); font-size: var(--text-sm);
}
.run {
  justify-self: start; margin-top: var(--space-3);
  background: var(--color-ink0); color: var(--color-bg0);
  border: none; padding: var(--space-2) var(--space-4);
  font-family: var(--font-mono); font-size: var(--text-sm); cursor: pointer;
}
.run:hover { background: var(--color-accent); }
```

- [ ] **Step 4: Run test, expect PASS**

Run: `cd argus && pnpm test tests/unit/test/ScanComposer.test.tsx -- --run`

- [ ] **Step 5: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/components/test/ScanComposer.tsx argus/components/test/ScanComposer.module.css argus/tests/unit/test/ScanComposer.test.tsx && git commit -m "feat(argus): add ScanComposer component"
```

---

### Task 44: LiveProgress component

**Files:**
- Create: `argus/components/test/LiveProgress.tsx`
- Create: `argus/components/test/LiveProgress.module.css`
- Test: `argus/tests/unit/test/LiveProgress.test.tsx`

Renders a horizontal strip of cells (one per registered check), each colored by status (pending/running/pass/fail/skip/error). Updates as `onProgress` events arrive.

- [ ] **Step 1: Write failing test**

```tsx
// argus/tests/unit/test/LiveProgress.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LiveProgress } from '@/components/test/LiveProgress'

describe('LiveProgress', () => {
  it('renders one cell per check id', () => {
    render(<LiveProgress checkIds={['T-01', 'T-03', 'J-01']} statuses={{}} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('applies status data attribute', () => {
    render(<LiveProgress checkIds={['T-01']} statuses={{ 'T-01': 'pass' }} />)
    expect(screen.getByLabelText('T-01').getAttribute('data-status')).toBe('pass')
  })

  it('shows pending for unreported checks', () => {
    render(<LiveProgress checkIds={['T-01']} statuses={{}} />)
    expect(screen.getByLabelText('T-01').getAttribute('data-status')).toBe('pending')
  })
})
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Implement**

```tsx
// argus/components/test/LiveProgress.tsx
'use client'

import styles from './LiveProgress.module.css'
import type { CheckStatus } from '@/lib/store/types'

interface Props {
  checkIds: string[]
  statuses: Record<string, CheckStatus | 'running'>
}

export function LiveProgress({ checkIds, statuses }: Props) {
  return (
    <ol className={styles.strip} data-argus="live-progress">
      {checkIds.map((id) => (
        <li
          key={id}
          aria-label={id}
          title={id}
          className={styles.cell}
          data-status={statuses[id] ?? 'pending'}
        />
      ))}
    </ol>
  )
}
```

```css
/* argus/components/test/LiveProgress.module.css */
.strip {
  display: grid;
  grid-template-columns: repeat(auto-fill, 14px);
  gap: 2px;
  list-style: none;
  padding: var(--space-3);
  margin: 0;
}
.cell {
  width: 14px; height: 14px;
  background: var(--color-grid);
  border: 1px solid var(--color-bg1);
}
.cell[data-status="pending"] { background: var(--color-grid); }
.cell[data-status="running"] { background: var(--color-accent); animation: pulse 0.8s infinite; }
.cell[data-status="pass"]    { background: var(--color-pass); }
.cell[data-status="fail"]    { background: var(--color-fail); }
.cell[data-status="skip"]    { background: var(--color-ink3); }
.cell[data-status="error"]   { background: var(--color-error); }
@keyframes pulse { 50% { opacity: 0.4; } }
```

(Tokens `--color-pass`, `--color-fail`, `--color-error` were added in Phase 1 token sheet.)

- [ ] **Step 4: Test, commit**

```bash
cd argus && pnpm test tests/unit/test/LiveProgress.test.tsx -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/components/test/LiveProgress.tsx argus/components/test/LiveProgress.module.css argus/tests/unit/test/LiveProgress.test.tsx && git commit -m "feat(argus): add LiveProgress strip component"
```

---

### Task 45: GradeReveal component

**Files:**
- Create: `argus/components/test/GradeReveal.tsx`
- Create: `argus/components/test/GradeReveal.module.css`
- Test: `argus/tests/unit/test/GradeReveal.test.tsx`

Big grade letter (e.g. "B+") + summary counts (pass/fail/skip/error) + total duration.

- [ ] **Step 1: Write failing test**

```tsx
// argus/tests/unit/test/GradeReveal.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GradeReveal } from '@/components/test/GradeReveal'

describe('GradeReveal', () => {
  it('shows grade letter', () => {
    render(<GradeReveal grade="B+" summary={{ pass: 50, fail: 10, skip: 5, error: 0 }} durationMs={1234} />)
    expect(screen.getByText('B+')).toBeTruthy()
  })

  it('shows summary counts', () => {
    render(<GradeReveal grade="A" summary={{ pass: 60, fail: 0, skip: 0, error: 0 }} durationMs={500} />)
    expect(screen.getByText(/60/)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Implement**

```tsx
// argus/components/test/GradeReveal.tsx
import styles from './GradeReveal.module.css'
import type { Grade } from '@/lib/store/types'

interface Props {
  grade: Grade
  summary: { pass: number; fail: number; skip: number; error: number }
  durationMs: number
}

export function GradeReveal({ grade, summary, durationMs }: Props) {
  const total = summary.pass + summary.fail + summary.skip + summary.error
  return (
    <div className={styles.root} data-grade={grade}>
      <div className={styles.letter}>{grade}</div>
      <dl className={styles.summary}>
        <div><dt>pass</dt><dd>{summary.pass} / {total}</dd></div>
        <div><dt>fail</dt><dd>{summary.fail}</dd></div>
        <div><dt>skip</dt><dd>{summary.skip}</dd></div>
        <div><dt>error</dt><dd>{summary.error}</dd></div>
        <div><dt>duration</dt><dd>{(durationMs / 1000).toFixed(1)}s</dd></div>
      </dl>
    </div>
  )
}
```

```css
.root { display: grid; grid-template-columns: auto 1fr; gap: var(--space-6); padding: var(--space-4); align-items: center; font-family: var(--font-mono); }
.letter { font-size: 96px; line-height: 1; color: var(--color-ink0); font-weight: 600; }
.root[data-grade^="F"] .letter { color: var(--color-fail); }
.root[data-grade^="A"] .letter { color: var(--color-pass); }
.summary { display: grid; grid-template-columns: repeat(5, 1fr); gap: var(--space-3); margin: 0; }
.summary > div { display: grid; gap: 2px; }
.summary dt { color: var(--color-ink3); font-size: var(--text-xs); text-transform: uppercase; }
.summary dd { color: var(--color-ink0); font-size: var(--text-lg); margin: 0; }
```

- [ ] **Step 3: Test, commit**

```bash
cd argus && pnpm test tests/unit/test/GradeReveal.test.tsx -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/components/test/GradeReveal.tsx argus/components/test/GradeReveal.module.css argus/tests/unit/test/GradeReveal.test.tsx && git commit -m "feat(argus): add GradeReveal component"
```

---

### Task 46: CategoryStrip component

**Files:**
- Create: `argus/components/test/CategoryStrip.tsx`
- Create: `argus/components/test/CategoryStrip.module.css`
- Test: `argus/tests/unit/test/CategoryStrip.test.tsx`

19 horizontal rows (one per category). Each shows category name, pass count, fail count, and an inline progress fill. Clicking a row toggles `selectedCategory` filter on the parent page.

- [ ] **Step 1: Write failing test**

```tsx
// argus/tests/unit/test/CategoryStrip.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CategoryStrip } from '@/components/test/CategoryStrip'
import type { CheckResult } from '@/lib/store/types'

const results: CheckResult[] = [
  { checkId: 'T-01', category: 'transport', severity: 'major', status: 'pass', durationMs: 5 },
  { checkId: 'T-07', category: 'transport', severity: 'major', status: 'fail', durationMs: 5 },
  { checkId: 'J-01', category: 'jsonrpc', severity: 'major', status: 'pass', durationMs: 5 },
]

describe('CategoryStrip', () => {
  it('renders one row per category present', () => {
    render(<CategoryStrip results={results} onSelect={() => {}} selected={null} />)
    expect(screen.getByText(/transport/i)).toBeTruthy()
    expect(screen.getByText(/jsonrpc/i)).toBeTruthy()
  })

  it('calls onSelect with category id when row clicked', () => {
    const onSelect = vi.fn()
    render(<CategoryStrip results={results} onSelect={onSelect} selected={null} />)
    fireEvent.click(screen.getByText(/transport/i))
    expect(onSelect).toHaveBeenCalledWith('transport')
  })
})
```

- [ ] **Step 2: Implement**

```tsx
// argus/components/test/CategoryStrip.tsx
'use client'

import styles from './CategoryStrip.module.css'
import type { CheckResult } from '@/lib/store/types'

interface Props {
  results: CheckResult[]
  selected: string | null
  onSelect: (category: string | null) => void
}

const ORDER = [
  'transport', 'jsonrpc', 'lifecycle', 'capabilities',
  'tools', 'resources', 'prompts',
  'sampling', 'elicitation', 'utilities',
  'authorization', 'security', 'tasks', 'hygiene',
  'rc', 'discovery', 'stateless', 'subscriptions', 'caching', 'mrtr',
]

export function CategoryStrip({ results, selected, onSelect }: Props) {
  const byCat = new Map<string, { pass: number; fail: number; skip: number; total: number }>()
  for (const r of results) {
    const e = byCat.get(r.category) ?? { pass: 0, fail: 0, skip: 0, total: 0 }
    e.total++
    if (r.status === 'pass') e.pass++
    else if (r.status === 'fail') e.fail++
    else if (r.status === 'skip') e.skip++
    byCat.set(r.category, e)
  }

  return (
    <ul className={styles.strip} data-argus="category-strip">
      {ORDER.filter((c) => byCat.has(c)).map((c) => {
        const s = byCat.get(c)!
        const pct = s.total === 0 ? 0 : (s.pass / Math.max(1, s.total - s.skip)) * 100
        return (
          <li
            key={c}
            className={styles.row}
            data-selected={selected === c ? 'true' : undefined}
            onClick={() => onSelect(selected === c ? null : c)}
          >
            <span className={styles.name}>{c}</span>
            <span className={styles.counts}>
              <span className={styles.pass}>{s.pass}</span>
              <span className={styles.fail}>{s.fail}</span>
              <span className={styles.skip}>{s.skip}</span>
            </span>
            <span className={styles.bar}>
              <span className={styles.fill} style={{ width: `${pct}%` }} />
            </span>
          </li>
        )
      })}
    </ul>
  )
}
```

```css
.strip { list-style: none; padding: 0; margin: 0; font-family: var(--font-mono); }
.row {
  display: grid; grid-template-columns: 160px 120px 1fr; gap: var(--space-3);
  align-items: center; padding: var(--space-2) var(--space-3);
  border-bottom: 1px solid var(--color-grid); cursor: pointer;
}
.row:hover { background: var(--color-bg1); }
.row[data-selected="true"] { background: var(--color-bg1); border-left: 2px solid var(--color-accent); }
.name { color: var(--color-ink0); font-size: var(--text-sm); }
.counts { display: flex; gap: var(--space-2); font-size: var(--text-xs); }
.pass { color: var(--color-pass); }
.fail { color: var(--color-fail); }
.skip { color: var(--color-ink3); }
.bar { height: 4px; background: var(--color-grid); position: relative; }
.fill { position: absolute; left: 0; top: 0; bottom: 0; background: var(--color-pass); }
```

- [ ] **Step 3: Test, commit**

```bash
cd argus && pnpm test tests/unit/test/CategoryStrip.test.tsx -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/components/test/CategoryStrip.tsx argus/components/test/CategoryStrip.module.css argus/tests/unit/test/CategoryStrip.test.tsx && git commit -m "feat(argus): add CategoryStrip component"
```

---

### Task 47: CheckCard component

**Files:**
- Create: `argus/components/test/CheckCard.tsx`
- Create: `argus/components/test/CheckCard.module.css`
- Test: `argus/tests/unit/test/CheckCard.test.tsx`

Renders one check failure (or pass). Header shows id, title, status badge. Body (collapsed by default for pass, expanded for fail) shows expected/observed, spec quote, optional curl command, fix link.

- [ ] **Step 1: Write failing test**

```tsx
// argus/tests/unit/test/CheckCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CheckCard } from '@/components/test/CheckCard'

const failResult = {
  checkId: 'T-07', category: 'transport', severity: 'major' as const, status: 'fail' as const,
  durationMs: 12, observed: 'Server accepted disallowed Origin',
  expected: '403 Forbidden', specRef: 'https://example.com/spec', fixHint: undefined,
}

describe('CheckCard', () => {
  it('shows id and observed text', () => {
    render(<CheckCard result={failResult} title="Origin validation" specQuote="MUST validate Origin." />)
    expect(screen.getByText('T-07')).toBeTruthy()
    expect(screen.getByText(/Server accepted disallowed Origin/)).toBeTruthy()
  })

  it('expanded by default on fail; collapsed on pass', () => {
    const { rerender } = render(<CheckCard result={failResult} title="t" specQuote="q" />)
    expect(screen.getByText(/spec/i)).toBeTruthy()
    rerender(<CheckCard result={{ ...failResult, status: 'pass' }} title="t" specQuote="q" />)
    expect(screen.queryByText(/spec/i)).toBeNull()
  })

  it('toggles open on header click', () => {
    render(<CheckCard result={{ ...failResult, status: 'pass' }} title="t" specQuote="q" />)
    fireEvent.click(screen.getByText('T-07'))
    expect(screen.getByText(/spec/i)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Implement**

```tsx
// argus/components/test/CheckCard.tsx
'use client'

import { useState } from 'react'
import styles from './CheckCard.module.css'
import type { CheckResult } from '@/lib/store/types'

interface Props {
  result: CheckResult
  title: string
  specQuote: string
  curlCommand?: string
}

export function CheckCard({ result, title, specQuote, curlCommand }: Props) {
  const [open, setOpen] = useState(result.status === 'fail')
  return (
    <article className={styles.card} data-status={result.status}>
      <header className={styles.header} onClick={() => setOpen((v) => !v)}>
        <span className={styles.id}>{result.checkId}</span>
        <span className={styles.title}>{title}</span>
        <span className={styles.status}>{result.status}</span>
      </header>
      {open && (
        <div className={styles.body}>
          {result.expected && (
            <div className={styles.row}>
              <span className={styles.label}>expected</span>
              <code>{result.expected}</code>
            </div>
          )}
          {result.observed && (
            <div className={styles.row}>
              <span className={styles.label}>observed</span>
              <code>{result.observed}</code>
            </div>
          )}
          {specQuote && (
            <div className={styles.row}>
              <span className={styles.label}>spec</span>
              <blockquote>{specQuote}</blockquote>
              {result.specRef && (
                <a href={result.specRef} target="_blank" rel="noreferrer" className={styles.link}>
                  {result.specRef}
                </a>
              )}
            </div>
          )}
          {curlCommand && (
            <div className={styles.row}>
              <span className={styles.label}>repro</span>
              <pre className={styles.curl}>{curlCommand}</pre>
            </div>
          )}
          {result.fixHint && (
            <div className={styles.row}>
              <span className={styles.label}>fix</span>
              <code>{result.fixHint}</code>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
```

```css
.card { border: 1px solid var(--color-grid); margin-bottom: var(--space-2); font-family: var(--font-mono); }
.card[data-status="fail"] { border-left: 2px solid var(--color-fail); }
.card[data-status="pass"] { border-left: 2px solid var(--color-pass); }
.card[data-status="skip"] { border-left: 2px solid var(--color-ink3); }
.header {
  display: grid; grid-template-columns: 80px 1fr 60px; gap: var(--space-2);
  padding: var(--space-2) var(--space-3); cursor: pointer;
  background: var(--color-bg1);
}
.id { color: var(--color-ink0); font-weight: 600; }
.title { color: var(--color-ink1); }
.status { color: var(--color-ink2); font-size: var(--text-xs); text-transform: uppercase; text-align: right; }
.body { padding: var(--space-3); display: grid; gap: var(--space-3); }
.row { display: grid; gap: var(--space-1); }
.label { color: var(--color-ink3); font-size: var(--text-xs); text-transform: uppercase; }
.row code { color: var(--color-ink0); background: var(--color-bg2); padding: 2px 4px; font-size: var(--text-xs); }
.row blockquote { margin: 0; color: var(--color-ink1); border-left: 2px solid var(--color-grid); padding-left: var(--space-2); }
.link { color: var(--color-accent); font-size: var(--text-xs); word-break: break-all; }
.curl { color: var(--color-ink1); background: var(--color-bg2); padding: var(--space-2); font-size: var(--text-xs); overflow-x: auto; margin: 0; }
```

- [ ] **Step 3: Test, commit**

```bash
cd argus && pnpm test tests/unit/test/CheckCard.test.tsx -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/components/test/CheckCard.tsx argus/components/test/CheckCard.module.css argus/tests/unit/test/CheckCard.test.tsx && git commit -m "feat(argus): add CheckCard component"
```

---

### Task 48: RawProtocolLog component

**Files:**
- Create: `argus/components/test/RawProtocolLog.tsx`
- Create: `argus/components/test/RawProtocolLog.module.css`
- Test: `argus/tests/unit/test/RawProtocolLog.test.tsx`

Collapsible JSON-RPC inspector. Shows a list of request/response/notification entries with timestamp, direction (→/←), method/id summary, expandable to full JSON.

- [ ] **Step 1: Write failing test**

```tsx
// argus/tests/unit/test/RawProtocolLog.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { RawProtocolLog, type LogEntry } from '@/components/test/RawProtocolLog'

const entries: LogEntry[] = [
  { ts: 1, direction: 'out', payload: { jsonrpc: '2.0', id: 1, method: 'initialize' } },
  { ts: 2, direction: 'in', payload: { jsonrpc: '2.0', id: 1, result: {} } },
]

describe('RawProtocolLog', () => {
  it('renders summary line per entry', () => {
    render(<RawProtocolLog entries={entries} />)
    expect(screen.getByText(/initialize/)).toBeTruthy()
  })

  it('expands to show full JSON on row click', () => {
    render(<RawProtocolLog entries={entries} />)
    fireEvent.click(screen.getByText(/initialize/))
    expect(screen.getByText(/"jsonrpc": "2.0"/)).toBeTruthy()
  })
})
```

- [ ] **Step 2: Implement**

```tsx
// argus/components/test/RawProtocolLog.tsx
'use client'

import { useState } from 'react'
import styles from './RawProtocolLog.module.css'

export interface LogEntry {
  ts: number
  direction: 'in' | 'out'
  payload: unknown
}

interface Props { entries: LogEntry[] }

function summarize(entry: LogEntry): string {
  const p = entry.payload as any
  if (p?.method) return `${p.method}${p.id !== undefined ? ` (id=${p.id})` : ''}`
  if (p?.result) return `result (id=${p.id})`
  if (p?.error) return `error ${p.error?.code} (id=${p.id})`
  return '(unknown)'
}

export function RawProtocolLog({ entries }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  return (
    <ol className={styles.log} data-argus="raw-log">
      {entries.map((e, i) => (
        <li key={i} className={styles.entry}>
          <div className={styles.head} onClick={() => setOpenIdx(openIdx === i ? null : i)}>
            <span className={styles.dir} data-dir={e.direction}>{e.direction === 'out' ? '→' : '←'}</span>
            <span className={styles.ts}>{e.ts}</span>
            <span className={styles.summary}>{summarize(e)}</span>
          </div>
          {openIdx === i && (
            <pre className={styles.json}>{JSON.stringify(e.payload, null, 2)}</pre>
          )}
        </li>
      ))}
    </ol>
  )
}
```

```css
.log { list-style: none; padding: 0; margin: 0; font-family: var(--font-mono); font-size: var(--text-xs); }
.entry { border-bottom: 1px solid var(--color-grid); }
.head { display: grid; grid-template-columns: 24px 80px 1fr; gap: var(--space-2); padding: var(--space-1) var(--space-3); cursor: pointer; }
.head:hover { background: var(--color-bg1); }
.dir { font-weight: 600; }
.dir[data-dir="out"] { color: var(--color-accent); }
.dir[data-dir="in"]  { color: var(--color-pass); }
.ts { color: var(--color-ink3); }
.summary { color: var(--color-ink0); }
.json { margin: 0; padding: var(--space-3); background: var(--color-bg2); color: var(--color-ink1); overflow-x: auto; }
```

- [ ] **Step 3: Test, commit**

```bash
cd argus && pnpm test tests/unit/test/RawProtocolLog.test.tsx -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/components/test/RawProtocolLog.tsx argus/components/test/RawProtocolLog.module.css argus/tests/unit/test/RawProtocolLog.test.tsx && git commit -m "feat(argus): add RawProtocolLog component"
```

---

### Task 49: Wire ScanComposer + LiveProgress into `app/test/page.tsx`

**Files:**
- Modify: `argus/app/test/page.tsx`
- Create: `argus/app/test/page.module.css`
- Test: `argus/tests/unit/test/TestIndexPage.test.tsx`

The page lifecycle:
1. Mount → render ScanComposer.
2. On `onStart(cfg)`: persist endpoint via `usePrefsStore.addEndpoint`, build CheckContext, call `runScan` with `onProgress` callback that updates local React state.
3. Render LiveProgress while scan runs.
4. On completion: build Scan object, call `useScansStore.addScan`, navigate to `/test/[scanId]`.

- [ ] **Step 1: Write failing integration test**

```tsx
// argus/tests/unit/test/TestIndexPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRouter } from 'next/navigation'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/lib/conformance/runner', () => ({
  runScan: vi.fn(async (_checks, _ctx, { onProgress }) => {
    onProgress?.('start', { checkId: 'T-01' } as any)
    onProgress?.('pass', { checkId: 'T-01', status: 'pass', durationMs: 1 } as any)
    return { results: [{ checkId: 'T-01', status: 'pass', durationMs: 1 }], grade: 'A', durationMs: 5 }
  }),
}))

import TestIndexPage from '@/app/test/page'

describe('Test index page', () => {
  beforeEach(() => {
    ;(useRouter as any).mockReturnValue({ push: vi.fn() })
  })

  it('submits scan and renders progress', async () => {
    render(<TestIndexPage />)
    fireEvent.change(screen.getByLabelText(/endpoint/i), { target: { value: 'http://127.0.0.1:3845/mcp' } })
    fireEvent.click(screen.getByRole('button', { name: /run scan/i }))
    await waitFor(() => expect(screen.queryByLabelText('T-01')).not.toBeNull())
  })
})
```

- [ ] **Step 2: Run, expect FAIL**

- [ ] **Step 3: Implement page**

```tsx
// argus/app/test/page.tsx
'use client'

import { useState, useCallback, useId } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'
import { ScanComposer, type ScanConfig } from '@/components/test/ScanComposer'
import { LiveProgress } from '@/components/test/LiveProgress'
import { useScansStore } from '@/lib/store/scans'
import { usePrefsStore } from '@/lib/store/prefs'
import { listChecks } from '@/lib/conformance/registry'
import { runScan } from '@/lib/conformance/runner'
import { toStoreResult } from '@/lib/conformance/adapter'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createBridgeTransport } from '@/lib/conformance/transport/bridge'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckStatus, ScanId } from '@/lib/store/types'

export default function TestIndexPage() {
  const router = useRouter()
  const addScan = useScansStore((s) => s.addScan)
  const addEndpoint = usePrefsStore((s) => s.addEndpoint)
  const [running, setRunning] = useState(false)
  const [statuses, setStatuses] = useState<Record<string, CheckStatus | 'running'>>({})
  const checks = listChecks().filter((c) => c.appliesTo.includes('DRAFT-2026-v1'))
  const checkIds = checks.map((c) => c.id)

  const start = useCallback(async (cfg: ScanConfig) => {
    addEndpoint(cfg.endpoint)
    setRunning(true)
    setStatuses({})

    const transport =
      cfg.transport === 'stdio-ws'
        ? createBridgeTransport({ url: cfg.bridgeUrl!, bridgeCommand: cfg.bridgeCommand!, protocolVersion: cfg.spec })
        : createHttpTransport({
            url: cfg.endpoint, spec: cfg.spec, bearer: cfg.bearerToken,
            rawHttp: createRawHttpClient({ url: cfg.endpoint, proxyUrl: cfg.proxyUrl }),
          })
    const rawHttp = createRawHttpClient({ url: cfg.endpoint, proxyUrl: cfg.proxyUrl })
    const client = createMcpClient(transport, cfg.spec, cfg.endpoint)
    const init: any = await client.initialize()

    const ctx = {
      client, rawHttp,
      transport: { kind: cfg.transport, url: cfg.endpoint },
      spec: cfg.spec,
      serverInfo: init.serverInfo,
      capabilities: init.capabilities ?? {},
      log: () => {},
    } as any

    const started = Date.now()
    const { results, grade } = await runScan(checks, ctx, {
      onProgress: (phase, result, check) => {
        if (phase === 'start' && check) {
          setStatuses((s) => ({ ...s, [check.id]: 'running' }))
        } else if (result) {
          setStatuses((s) => ({ ...s, [result.checkId]: result.status }))
        }
      },
    })
    const durationMs = Date.now() - started

    const id = `SCN-${Date.now().toString(36).toUpperCase()}` as ScanId
    const summary = results.reduce(
      (acc, r) => ({ ...acc, [r.status]: (acc as any)[r.status] + 1 }),
      { pass: 0, fail: 0, skip: 0, error: 0 } as any,
    )
    addScan({
      id, startedAt: new Date(started).toISOString(),
      endpoint: cfg.endpoint, transport: cfg.transport, spec: 'draft-2026-v1',
      durationMs, grade, summary,
      results: results.map((r) => toStoreResult(r, checks.find((c) => c.id === r.checkId)!)),
    })
    setRunning(false)
    router.push(`/test/${id}`)
  }, [addScan, addEndpoint, checks, router])

  return (
    <section className={styles.root}>
      {!running && <ScanComposer onStart={start} />}
      {running && <LiveProgress checkIds={checkIds} statuses={statuses} />}
    </section>
  )
}
```

```css
.root { padding: var(--space-4); font-family: var(--font-mono); }
```

- [ ] **Step 4: Test, commit**

```bash
cd argus && pnpm test tests/unit/test/TestIndexPage.test.tsx -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/app/test/page.tsx argus/app/test/page.module.css argus/tests/unit/test/TestIndexPage.test.tsx && git commit -m "feat(argus): wire scan flow into /test page"
```

---

### Task 50: Wire scan-detail page (`app/test/[scanId]/page.tsx`)

**Files:**
- Modify: `argus/app/test/[scanId]/page.tsx`
- Create: `argus/app/test/[scanId]/page.module.css`
- Test: `argus/tests/unit/test/ScanDetailPage.test.tsx`

Page reads scan from `useScansStore`, renders GradeReveal at top, CategoryStrip on left (33% column), CheckCard list on right (66% column). Category filter narrows the list.

- [ ] **Step 1: Write failing test**

```tsx
// argus/tests/unit/test/ScanDetailPage.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect, beforeEach } from 'vitest'
import { useScansStore } from '@/lib/store/scans'
import ScanDetailPage from '@/app/test/[scanId]/page'

describe('Scan detail page', () => {
  beforeEach(() => {
    localStorage.clear()
    useScansStore.setState({ scans: {} })
    useScansStore.getState().addScan({
      id: 'SCN-XYZ' as any,
      startedAt: '2026-05-27T10:00:00Z',
      endpoint: 'http://x', transport: 'http', spec: 'draft-2026-v1',
      durationMs: 1234, grade: 'B+',
      summary: { pass: 5, fail: 1, skip: 0, error: 0 },
      results: [
        { checkId: 'T-01', category: 'transport', severity: 'major', status: 'pass', durationMs: 5 },
        { checkId: 'T-07', category: 'transport', severity: 'major', status: 'fail', durationMs: 5, observed: 'accepted bad origin' },
      ],
    })
  })

  it('renders grade and check rows', async () => {
    const Comp = await ScanDetailPage({ params: Promise.resolve({ scanId: 'SCN-XYZ' }) }) as any
    render(Comp)
    expect(screen.getByText('B+')).toBeTruthy()
    expect(screen.getByText('T-07')).toBeTruthy()
  })
})
```

Since the page is `'use client'` we test against a thin client wrapper.

- [ ] **Step 2: Implement page (client wrapper + server entry)**

```tsx
// argus/app/test/[scanId]/page.tsx
import ClientView from './ClientView'

interface Props { params: Promise<{ scanId: string }> }

export default async function ScanDetailPage({ params }: Props) {
  const { scanId } = await params
  return <ClientView scanId={scanId} />
}

export function generateStaticParams() {
  return [{ scanId: 'placeholder' }]
}
```

```tsx
// argus/app/test/[scanId]/ClientView.tsx
'use client'

import { useState } from 'react'
import styles from './page.module.css'
import { useScansStore } from '@/lib/store/scans'
import { GradeReveal } from '@/components/test/GradeReveal'
import { CategoryStrip } from '@/components/test/CategoryStrip'
import { CheckCard } from '@/components/test/CheckCard'
import { getCheck } from '@/lib/conformance/registry'

export default function ClientView({ scanId }: { scanId: string }) {
  const scan = useScansStore((s) => s.scans[scanId as any])
  const [category, setCategory] = useState<string | null>(null)
  if (!scan) {
    return <section className={styles.empty}>scan {scanId} not found</section>
  }
  const filtered = category ? scan.results.filter((r) => r.category === category) : scan.results
  return (
    <section className={styles.root}>
      <GradeReveal grade={scan.grade} summary={scan.summary} durationMs={scan.durationMs} />
      <div className={styles.split}>
        <aside className={styles.aside}>
          <CategoryStrip results={scan.results} selected={category} onSelect={setCategory} />
        </aside>
        <main className={styles.main}>
          {filtered.map((r) => {
            const meta = getCheck(r.checkId)
            return (
              <CheckCard
                key={r.checkId}
                result={r}
                title={meta?.title ?? r.checkId}
                specQuote={meta?.specRef.quote ?? ''}
              />
            )
          })}
        </main>
      </div>
    </section>
  )
}
```

```css
.root { padding: var(--space-4); font-family: var(--font-mono); display: grid; gap: var(--space-4); }
.split { display: grid; grid-template-columns: 320px 1fr; gap: var(--space-4); }
.aside { border-right: 1px solid var(--color-grid); }
.main { display: grid; gap: var(--space-2); }
.empty { padding: var(--space-6); color: var(--color-ink3); }
```

- [ ] **Step 3: Test, commit**

```bash
cd argus && pnpm test tests/unit/test/ScanDetailPage.test.tsx -- --run
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/app/test/[scanId]/page.tsx argus/app/test/[scanId]/ClientView.tsx argus/app/test/[scanId]/page.module.css argus/tests/unit/test/ScanDetailPage.test.tsx && git commit -m "feat(argus): wire scan detail page"
```

---

## Group J — Persistence + final wiring

### Task 51: End-to-end smoke test against torture-server

**Files:**
- Create: `argus/tests/unit/conformance/e2e-smoke.test.ts`

Boot torture-server with all violations disabled, run all 60 registered checks, assert grade A+ (or A) and 0 fails.

- [ ] **Step 1: Write test**

```ts
// argus/tests/unit/conformance/e2e-smoke.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTortureApp } from '../../../../torture-server/src/index'
import { listChecks } from '@/lib/conformance/registry'
import { runScan } from '@/lib/conformance/runner'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createMcpClient } from '@/lib/conformance/client'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'

let server: Server, port: number

beforeAll(async () => {
  const app = createTortureApp({ violations: {} })
  await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => r()) })
  port = (server.address() as AddressInfo).port
})
afterAll(() => new Promise<void>((r) => server.close(() => r())))

describe('e2e smoke', () => {
  it('clean torture-server scores A or better', async () => {
    const url = `http://127.0.0.1:${port}/mcp`
    const rawHttp = createRawHttpClient({ url })
    const transport = createHttpTransport({ url, spec: 'DRAFT-2026-v1', rawHttp })
    const client = createMcpClient(transport, 'DRAFT-2026-v1', url)
    const init: any = await client.initialize()
    const ctx = {
      client, rawHttp,
      transport: { kind: 'http', url },
      spec: 'DRAFT-2026-v1' as const,
      serverInfo: init.serverInfo,
      capabilities: init.capabilities ?? {},
      log: () => {},
    }
    const { grade, results } = await runScan(listChecks(), ctx, {})
    const fails = results.filter((r) => r.status === 'fail')
    expect(fails).toEqual([])
    expect(['A+', 'A']).toContain(grade)
  }, 30_000)
})
```

- [ ] **Step 2: Run; if fails, investigate which checks falsely fail against a clean server**

Run: `cd argus && pnpm test tests/unit/conformance/e2e-smoke.test.ts -- --run`

Iterate: fix any check whose pass-path on torture-server is incorrect. Goal: clean torture-server passes 100%.

- [ ] **Step 3: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/tests/unit/conformance/e2e-smoke.test.ts && git commit -m "test(argus): e2e smoke against clean torture-server"
```

---

### Task 52: Static-export verification

**Files:**
- Modify: `argus/next.config.ts` (if needed; should already have `output: 'export'`)

- [ ] **Step 1: Build**

Run: `cd argus && pnpm build`
Expected: PASS — static export under `argus/out/`.

- [ ] **Step 2: Serve and smoke-test**

Run: `cd argus/out && python3 -m http.server 4173`
In browser: `http://localhost:4173/test` → ScanComposer renders → submit endpoint of `http://127.0.0.1:<torture-port>/mcp` → LiveProgress fills → navigate to detail page → GradeReveal + CategoryStrip + CheckCards.

- [ ] **Step 3: Update README**

```markdown
## Status

Phase 2 — test engine. Run a scan against any HTTP MCP server. Optional companion packages `argus-proxy` and `argus-bridge` handle CORS and stdio respectively.
```

- [ ] **Step 4: Commit**

```bash
cd "/home/nishanth/Desktop/Personal/Akash/MCP Builder" && git add argus/README.md && git commit -m "docs(argus): mark Phase 2 status in README"
```

---

## Self-review checklist

Before declaring the plan complete, the controller verifies:

- [ ] Every spec category (19) has at least one task.
- [ ] All `★` checks in spec sections covered by Phase 2 are wired into the registry.
- [ ] Engine result shape matches store result shape via `toStoreResult` adapter (Task 42).
- [ ] `createBridgeTransport` is referenced in Task 49 but its imported module path matches Task 8 (`argus/lib/conformance/transport/bridge.ts`). Confirm.
- [ ] SSE response branch in `createHttpTransport` and the corresponding torture-server SSE response code path are both exercised in at least one test.
- [ ] `client.onRequest` and `client.onNotification` are defined in `argus/lib/conformance/client.ts` (Tasks 30 and 32 extended the client; this MUST be reflected in Task 9's spec).
- [ ] Every check.ts has `id`, `category`, `severity`, `confidence`, `appliesTo`, `title`, `probe`, `criterion`, `specRef`, `deterministic`, `run()`.
- [ ] No task says "similar to Task N"; every step contains the full code it produces.
- [ ] Commit messages follow `feat(argus): ...` and `feat(argus-proxy): ...` / `feat(argus-bridge): ...` conventions.
- [ ] No `git push` lines anywhere in the plan.

Apply fixes inline if any item fails.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-27-argus-phase2-test-engine.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, two-stage review (spec compliance → code quality) between tasks, fast iteration. Uses `superpowers:subagent-driven-development`.

2. **Inline Execution** — execute tasks in this session in batches with checkpoints for review. Uses `superpowers:executing-plans`.

Which approach?



