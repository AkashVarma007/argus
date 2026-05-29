import express, { type Express, type Request, type Response, type NextFunction } from 'express'
import { has, type ViolationConfig, type ViolationId } from './violations.js'

export interface MrtrConfig {
  include: boolean
  malformed?: boolean
  badTransport?: boolean
  malformedRoutes?: boolean
}

export interface TortureAppConfig extends ViolationConfig {
  authMode?: 'none' | 'oauth-discovery'
  mrtr?: MrtrConfig
}

const ALLOWED_ORIGINS = new Set(['http://localhost:3000', 'http://127.0.0.1:3000'])

function validOrigin(req: Request, cfg: ViolationConfig): boolean {
  const origin = req.header('origin')
  if (!origin) return true
  if (has(cfg, 'T-07')) return true
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

function isJsonRpcResponseBody(body: Record<string, unknown>): boolean {
  return body.jsonrpc === '2.0' && body.id !== undefined && ('result' in body || 'error' in body) && !('method' in body)
}

export function createTortureApp(cfg: TortureAppConfig): Express {
  const authMode = cfg.authMode ?? 'none'

  // Pending back-request resolution callbacks keyed by JSON-RPC id (stringified).
  const pendingBackRequests = new Map<string, (response: Record<string, unknown>) => void>()
  // Cancellation flags keyed by tool call id (stringified). Set to true when cancelled.
  const pendingCancellations = new Map<string, boolean>()
  // Pending tasks keyed by taskId.
  const pendingTasks = new Map<string, { method: string; createdAt: number; delayMs: number; cancelled: boolean }>()
  // H-02: call counter for tools/list to alternate type shapes.
  let h02CallCount = 0
  // SL-02: per-connection counter to make tools/list non-deterministic when violation is active.
  let sl02Counter = 0
  // CACHE-01: per-app counter to make tools/list non-deterministic when violation is active.
  let cache01Counter = 0
  // SUB-01/SUB-02: per-app resource subscription tracking.
  const subscribers = new Set<string>()

  const app = express()
  app.use(express.json({ limit: '4mb' }))

  // Return a proper JSON-RPC parse error when express.json fails to parse the body
  app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(200).json({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } })
      return
    }
    next(err)
  })

  // Discovery document endpoint (always active; DISC-01 violation returns 404).
  app.get('/.well-known/mcp', (req: Request, res: Response) => {
    if (has(cfg, 'DISC-01')) {
      res.status(404).send('Not Found')
      return
    }
    const base = `${req.protocol}://${req.headers.host}`
    res.status(200).json({
      endpoint: `${base}/mcp`,
      transports: ['http'],
      protocolVersions: ['2025-11-25', 'DRAFT-2026-v1'],
    })
  })

  // CORS preflight on /mcp (DISC-02 violation omits POST from Allow-Methods and MCP-Protocol-Version from Allow-Headers).
  app.options('/mcp', (_req: Request, res: Response) => {
    if (has(cfg, 'DISC-02')) {
      res
        .status(204)
        .set('Access-Control-Allow-Origin', '*')
        .set('Access-Control-Allow-Methods', 'GET, OPTIONS')
        .set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        .send('')
      return
    }
    res
      .status(204)
      .set('Access-Control-Allow-Origin', '*')
      .set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
      .set('Access-Control-Allow-Headers', 'Content-Type, MCP-Protocol-Version, Authorization')
      .send('')
  })

  // OAuth protected-resource metadata endpoint (only active in oauth-discovery mode).
  if (authMode === 'oauth-discovery') {
    app.get('/.well-known/oauth-protected-resource', (req: Request, res: Response) => {
      const base = `${req.protocol}://${req.headers.host}`
      const resource = `${base}/mcp`
      // AUTH-03 violation: omit authorization_servers (missing required field).
      if (has(cfg, 'AUTH-03')) {
        res.status(200).json({ resource, scopes_supported: ['mcp:read', 'mcp:write'] })
      } else {
        res.status(200).json({
          resource,
          authorization_servers: ['https://argus.example/issuer'],
          scopes_supported: ['mcp:read', 'mcp:write'],
        })
      }
    })
  }

  app.post('/mcp', (req: Request, res: Response) => {
    // OAuth auth-gate (active only in oauth-discovery mode).
    if (authMode === 'oauth-discovery') {
      // AUTH-01 violation: server fails to challenge (skip 401 enforcement entirely).
      if (!has(cfg, 'AUTH-01')) {
        // Check for URL token (access_token query param).
        const urlToken = req.query.access_token
        if (urlToken !== undefined) {
          // AUTH-10 violation: server wrongly accepts URL token — pass through.
          if (!has(cfg, 'AUTH-10')) {
            const resourceMetadataUrl = `${req.protocol}://${req.headers.host}/.well-known/oauth-protected-resource`
            const wwwAuth = has(cfg, 'AUTH-02')
              ? 'Bearer realm="argus"'
              : `Bearer realm="argus", resource_metadata="${resourceMetadataUrl}"`
            res.status(401).set('WWW-Authenticate', wwwAuth).send('')
            return
          }
          // AUTH-10 violation: accept the URL token, fall through to existing handling.
        } else {
          // No URL token — check Authorization header.
          const authHeader = req.header('authorization')
          if (!authHeader || !authHeader.toLowerCase().startsWith('bearer ')) {
            const resourceMetadataUrl = `${req.protocol}://${req.headers.host}/.well-known/oauth-protected-resource`
            const wwwAuth = has(cfg, 'AUTH-02')
              ? 'Bearer realm="argus"'
              : `Bearer realm="argus", resource_metadata="${resourceMetadataUrl}"`
            res.status(401).set('WWW-Authenticate', wwwAuth).send('')
            return
          }
          // Bearer header present — fall through to existing handling.
        }
      }
    }

    if (!validOrigin(req, cfg)) {
      res.status(403).send('Origin not allowed')
      return
    }
    if (!validProtoHeader(req, cfg)) {
      res.status(400).send('Bad MCP-Protocol-Version')
      return
    }
    if (has(cfg, 'T-01') && req.header('content-type') !== 'application/vnd.acme+json') {
      res.status(415).send('Unsupported Media Type')
      return
    }
    const body = req.body as { id?: unknown; method?: unknown; params?: unknown }

    // Client delivering a response to a server-initiated back-request.
    if (isJsonRpcResponseBody(body as Record<string, unknown>)) {
      const key = String(body.id)
      const resolve = pendingBackRequests.get(key)
      if (resolve) {
        pendingBackRequests.delete(key)
        resolve(body as Record<string, unknown>)
      }
      res.status(202).send('')
      return
    }

    if (body.method === undefined && body.id === undefined) {
      res.status(400).json(jsonRpcError(null, -32600, 'Invalid Request'))
      return
    }
    if (body.id === undefined) {
      // Handle notifications/cancelled: mark the referenced request as cancelled.
      if (body.method === 'notifications/cancelled') {
        const requestId = (body.params as { requestId?: unknown } | undefined)?.requestId
        if (requestId !== undefined) {
          pendingCancellations.set(String(requestId), true)
        }
        res.status(202).send('')
        return
      }
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
    // SL-01 violation: set a session cookie on every MCP response to indicate session-coupling.
    if (has(cfg, 'SL-01')) {
      res.setHeader('Set-Cookie', 'session=fake; Path=/; HttpOnly')
    }
    handleRequest(req, res, body, cfg, pendingBackRequests, pendingCancellations, pendingTasks, subscribers, { h02CallCount: () => ++h02CallCount, sl02Counter: () => ++sl02Counter, cache01Counter: () => ++cache01Counter })
  })

  app.put('/mcp', (_req, res) => res.status(405).send('Method Not Allowed'))
  app.patch('/mcp', (_req, res) => res.status(405).send('Method Not Allowed'))

  return app
}

async function handleSamplingProbe(
  res: Response,
  toolCallId: unknown,
  cfg: ViolationConfig,
  pendingBackRequests: Map<string, (response: Record<string, unknown>) => void>,
): Promise<void> {
  const backId = `srv-${String(toolCallId)}`

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.status(200)

  const samplingParams = has(cfg, 'SMP-02')
    ? { modelPreferences: {} }
    : { messages: [{ role: 'user', content: { type: 'text', text: 'hi' } }], modelPreferences: {} }

  const backRequest = { jsonrpc: '2.0', id: backId, method: 'sampling/createMessage', params: samplingParams }

  if (has(cfg, 'SMP-01')) {
    // SMP-01 violation: error even though client declared sampling.
    const event = `data: ${JSON.stringify({ jsonrpc: '2.0', id: toolCallId, error: { code: -32603, message: 'sampling not allowed' } })}\n\n`
    res.write(event)
    res.end()
    return
  }

  // Register promise before writing SSE so the client response can arrive any time.
  const clientResponse = new Promise<void>((resolve) => {
    pendingBackRequests.set(backId, (_response) => { resolve() })
  })

  res.write(`data: ${JSON.stringify(backRequest)}\n\n`)

  // Wait for client to POST back the sampling response (with timeout).
  const timeout = new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('sampling back-response timeout')), 10_000),
  )
  try {
    await Promise.race([clientResponse, timeout])
  } catch {
    pendingBackRequests.delete(backId)
    res.write(`data: ${JSON.stringify({ jsonrpc: '2.0', id: toolCallId, error: { code: -32603, message: 'sampling timeout' } })}\n\n`)
    res.end()
    return
  }

  res.write(`data: ${JSON.stringify(jsonRpcResult(toolCallId, { content: [{ type: 'text', text: 'sampled' }] }))}\n\n`)
  res.end()
}

async function handleElicitationProbe(
  res: Response,
  toolCallId: unknown,
  cfg: ViolationConfig,
  pendingBackRequests: Map<string, (response: Record<string, unknown>) => void>,
): Promise<void> {
  const backId = `srv-el-${String(toolCallId)}`

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.status(200)

  // EL-02 violation: omit both requestedSchema and url so neither variant is present.
  const elicitationParams = has(cfg, 'EL-02')
    ? {}
    : { requestedSchema: { type: 'object', properties: { field: { type: 'string' } } } }

  const backRequest = { jsonrpc: '2.0', id: backId, method: 'elicitation/create', params: elicitationParams }

  if (has(cfg, 'EL-01')) {
    // EL-01 violation: error even though client declared elicitation.
    const event = `data: ${JSON.stringify({ jsonrpc: '2.0', id: toolCallId, error: { code: -32603, message: 'elicitation not allowed' } })}\n\n`
    res.write(event)
    res.end()
    return
  }

  // Register promise before writing SSE so the client response can arrive any time.
  const clientResponse = new Promise<void>((resolve) => {
    pendingBackRequests.set(backId, (_response) => { resolve() })
  })

  res.write(`data: ${JSON.stringify(backRequest)}\n\n`)

  // Wait for client to POST back the elicitation response (with timeout).
  const timeout = new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('elicitation back-response timeout')), 10_000),
  )
  try {
    await Promise.race([clientResponse, timeout])
  } catch {
    pendingBackRequests.delete(backId)
    res.write(`data: ${JSON.stringify({ jsonrpc: '2.0', id: toolCallId, error: { code: -32603, message: 'elicitation timeout' } })}\n\n`)
    res.end()
    return
  }

  res.write(`data: ${JSON.stringify(jsonRpcResult(toolCallId, { content: [{ type: 'text', text: 'elicited' }] }))}\n\n`)
  res.end()
}

async function handleElicitationUrlProbe(
  res: Response,
  toolCallId: unknown,
  cfg: ViolationConfig,
  pendingBackRequests: Map<string, (response: Record<string, unknown>) => void>,
): Promise<void> {
  const backId = `srv-el-url-${String(toolCallId)}`

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.status(200)

  // RC-03 violation: use http instead of https.
  const url = has(cfg, 'RC-03') ? 'http://example.com/auth' : 'https://example.com/auth'
  const elicitationParams = { url }

  const backRequest = { jsonrpc: '2.0', id: backId, method: 'elicitation/create', params: elicitationParams }

  // Register promise before writing SSE so the client response can arrive any time.
  const clientResponse = new Promise<void>((resolve) => {
    pendingBackRequests.set(backId, (_response) => { resolve() })
  })

  res.write(`event: message\ndata: ${JSON.stringify(backRequest)}\n\n`)

  // Wait for client to POST back the elicitation response (with timeout).
  const timeout = new Promise<void>((_, reject) =>
    setTimeout(() => reject(new Error('elicitation-url back-response timeout')), 10_000),
  )
  try {
    await Promise.race([clientResponse, timeout])
  } catch {
    pendingBackRequests.delete(backId)
    res.write(`data: ${JSON.stringify({ jsonrpc: '2.0', id: toolCallId, error: { code: -32603, message: 'elicitation-url timeout' } })}\n\n`)
    res.end()
    return
  }

  res.write(`data: ${JSON.stringify(jsonRpcResult(toolCallId, { content: [{ type: 'text', text: 'done' }] }))}\n\n`)
  res.end()
}

async function handleSlowTool(
  res: Response,
  toolCallId: unknown,
  params: Record<string, unknown> | undefined,
  cfg: ViolationConfig,
  pendingCancellations: Map<string, boolean>,
): Promise<void> {
  const delayMs = typeof params?.arguments === 'object' && params.arguments !== null
    ? Number((params.arguments as Record<string, unknown>).delayMs ?? 800)
    : 800
  // _meta is at the outer params level alongside name and arguments.
  const progressToken = typeof params?._meta === 'object' && params._meta !== null
    ? (params._meta as Record<string, unknown>).progressToken
    : undefined
  const callKey = String(toolCallId)

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.status(200)

  // Register this call as not-yet-cancelled.
  pendingCancellations.set(callKey, false)

  const stepMs = 100
  const steps = Math.max(1, Math.ceil(delayMs / stepMs))

  for (let i = 0; i < steps; i++) {
    await new Promise<void>((r) => setTimeout(r, stepMs))

    if (pendingCancellations.get(callKey) === true && !has(cfg, 'U-04')) {
      // Honoring cancellation: terminate early.
      pendingCancellations.delete(callKey)
      res.write(`data: ${JSON.stringify({ jsonrpc: '2.0', id: toolCallId, result: { content: [{ type: 'text', text: 'cancelled' }], isError: false } })}\n\n`)
      res.end()
      return
    }

    if (progressToken !== undefined && !has(cfg, 'U-01')) {
      const progress = Math.round(((i + 1) / steps) * 100)
      res.write(`data: ${JSON.stringify({ jsonrpc: '2.0', method: 'notifications/progress', params: { progressToken, progress, total: 100 } })}\n\n`)
    }
  }

  pendingCancellations.delete(callKey)
  res.write(`data: ${JSON.stringify({ jsonrpc: '2.0', id: toolCallId, result: { content: [{ type: 'text', text: 'done' }] } })}\n\n`)
  res.end()
}

async function handleTouchResource(
  res: Response,
  toolCallId: unknown,
  params: Record<string, unknown> | undefined,
  cfg: ViolationConfig,
  subscribers: Set<string>,
): Promise<void> {
  const uri = typeof params?.arguments === 'object' && params.arguments !== null
    ? (params.arguments as Record<string, unknown>).uri
    : undefined

  if (typeof uri !== 'string') {
    res.status(200).json(jsonRpcError(toolCallId, -32602, 'missing uri argument'))
    return
  }

  const shouldEmit = subscribers.has(uri) || has(cfg, 'SUB-02')
  const suppress = has(cfg, 'SUB-01')

  if (shouldEmit && !suppress) {
    // Emit the notification inline via SSE before the tool result.
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.status(200)
    const notification = { jsonrpc: '2.0', method: 'notifications/resources/updated', params: { uri } }
    res.write(`data: ${JSON.stringify(notification)}\n\n`)
    res.write(`data: ${JSON.stringify(jsonRpcResult(toolCallId, { content: [{ type: 'text', text: 'touched' }] }))}\n\n`)
    res.end()
  } else {
    res.status(200).json(jsonRpcResult(toolCallId, { content: [{ type: 'text', text: 'touched' }] }))
  }
}

async function handleTouchTools(
  res: Response,
  toolCallId: unknown,
  cfg: ViolationConfig,
): Promise<void> {
  if (has(cfg, 'CACHE-05')) {
    // CACHE-05 violation: suppress the list_changed notification.
    res.status(200).json(jsonRpcResult(toolCallId, { content: [{ type: 'text', text: 'touched' }] }))
    return
  }

  // Emit the notification inline via SSE before the tool result.
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.status(200)
  const notification = { jsonrpc: '2.0', method: 'notifications/tools/list_changed', params: {} }
  res.write(`data: ${JSON.stringify(notification)}\n\n`)
  res.write(`data: ${JSON.stringify(jsonRpcResult(toolCallId, { content: [{ type: 'text', text: 'touched' }] }))}\n\n`)
  res.end()
}

function handleRequest(_req: Request, res: Response, body: { id?: unknown; method?: unknown; params?: unknown }, cfg: TortureAppConfig, pendingBackRequests: Map<string, (response: Record<string, unknown>) => void>, pendingCancellations: Map<string, boolean>, pendingTasks: Map<string, { method: string; createdAt: number; delayMs: number; cancelled: boolean }>, subscribers: Set<string>, state: { h02CallCount: () => number; sl02Counter: () => number; cache01Counter: () => number }): void {
  const { id, method, params } = body
  switch (method) {
    case 'initialize': {
      const clientProtocolVersion = (params as { protocolVersion?: unknown } | undefined)?.protocolVersion as string | undefined
      const baseInfo = has(cfg, 'L-02')
        ? { name: 42 as unknown as string, version: 7 as unknown as string }
        : { name: 'torture', version: '0.0.1' }
      const icons = has(cfg, 'RC-02')
        ? [{ url: 42 as unknown as string, sizes: '64x64' }]
        : [{ url: 'https://example.com/icon.png', sizes: '64x64' }]
      // MRTR: include mrtr metadata in serverInfo when configured.
      let mrtrMeta: Record<string, unknown> | undefined
      if (cfg.mrtr?.include) {
        if (has(cfg, 'MRTR-01')) {
          // MRTR-01 violation: include mrtr but omit required fields (malformed shape)
          mrtrMeta = { other: 'value' }
        } else if (cfg.mrtr.malformed) {
          // malformed config: omit routes
          mrtrMeta = { resources: [{ uri: 'file:///readme.md' }] }
        } else if (cfg.mrtr.badTransport) {
          // MRTR-03 violation: one route has disallowed transport
          mrtrMeta = {
            resources: [{ uri: 'file:///readme.md' }],
            routes: [
              { transport: 'http', url: 'http://127.0.0.1/mcp' },
              { transport: 'ws', url: 'ws://127.0.0.1/mcp' },
            ],
          }
        } else if (cfg.mrtr.malformedRoutes) {
          // malformedRoutes: routes is a non-array truthy value (triggers Array.isArray guard)
          mrtrMeta = {
            resources: [{ uri: 'file:///readme.md' }],
            routes: 'not-an-array' as unknown as unknown[],
          }
        } else {
          // clean MRTR
          mrtrMeta = {
            resources: [{ uri: 'file:///readme.md' }],
            routes: [{ transport: 'http', url: 'http://127.0.0.1/mcp' }],
          }
        }
      }
      const serverInfo = mrtrMeta
        ? { ...baseInfo, icons, mrtr: mrtrMeta }
        : { ...baseInfo, icons }
      const result = {
        protocolVersion: has(cfg, 'L-04') ? '0000-00-00' : (has(cfg, 'RC-01') ? '1999-01-01' : (clientProtocolVersion ?? '2025-11-25')),
        capabilities: has(cfg, 'C-01') ? {} : { tools: {}, resources: { subscribe: true }, prompts: {}, tasks: { list: {}, cancel: {} } },
        serverInfo,
      }
      if (has(cfg, 'J-01')) {
        res.status(200).json({ id, result })
      } else {
        res.status(200).json(jsonRpcResult(id, result))
      }
      return
    }
    case 'ping':
      if (has(cfg, 'J-02')) {
        res.status(200).json(jsonRpcResult('not-your-id', {}))
        return
      }
      res.status(200).json(jsonRpcResult(id, {}))
      return
    case 'tools/list':
      // C-06 absent → correct rejection; C-06 present → server wrongly accepts undeclared call
      if (has(cfg, 'C-01') && !has(cfg, 'C-06')) { res.status(200).json(jsonRpcError(id, -32601, 'Method not found')); return }
      if (has(cfg, 'TL-01')) { res.status(200).json(jsonRpcResult(id, { tools: [{ name: 'incomplete' }] })); return }
      if (has(cfg, 'TK-01')) {
        res.status(200).json(jsonRpcResult(id, {
          tools: [
            { name: 'echo', description: 'echoes its input', inputSchema: { type: 'object', properties: { msg: { type: 'string' } }, required: ['msg'] }, execution: { taskSupport: 'bogus' } },
          ],
        }))
        return
      }
      if (has(cfg, 'TL-05')) { res.status(200).json(jsonRpcResult(id, { tools: [{ name: 'dup', description: 'd', inputSchema: { type: 'object' } }, { name: 'dup', description: 'd', inputSchema: { type: 'object' } }] })); return }
      if (has(cfg, 'H-02')) {
        const callN = state.h02CallCount()
        if (callN % 2 === 1) {
          res.status(200).json(jsonRpcResult(id, { tools: [{ name: 'flaky', description: 'd', inputSchema: { type: 'object' } }] }))
        } else {
          res.status(200).json(jsonRpcResult(id, { tools: [{ name: 42 as unknown as string, description: 'd', inputSchema: { type: 'object' } }] }))
        }
        return
      }
      if (has(cfg, 'SL-02')) {
        // SL-02 violation: inject a unique tool on each call so the list is non-deterministic.
        const n = state.sl02Counter()
        res.status(200).json(jsonRpcResult(id, {
          tools: [
            { name: 'echo', description: 'echoes its input', inputSchema: { type: 'object', properties: { msg: { type: 'string' } }, required: ['msg'] } },
            { name: `__seed_${n}`, description: 'non-deterministic seed tool', inputSchema: { type: 'object', properties: {} } },
          ],
        }))
        return
      }
      if (has(cfg, 'CACHE-01')) {
        // CACHE-01 violation: inject a unique tool on each call so the list is non-deterministic across consecutive calls.
        const n = state.cache01Counter()
        res.status(200).json(jsonRpcResult(id, {
          tools: [
            { name: 'echo', description: 'echoes its input', inputSchema: { type: 'object', properties: { msg: { type: 'string' } }, required: ['msg'] } },
            { name: `__cache_${n}`, description: 'non-deterministic cache-busting tool', inputSchema: { type: 'object', properties: {} } },
          ],
        }))
        return
      }
      res.status(200).json(jsonRpcResult(id, {
        tools: [
          { name: 'echo', description: 'echoes its input', inputSchema: { type: 'object', properties: { msg: { type: 'string' } }, required: ['msg'] } },
          { name: '__torture/sampling-probe', description: 'issues a sampling/createMessage back-request and returns the result', inputSchema: { type: 'object', properties: {} } },
          { name: '__torture/elicitation-probe', description: 'issues an elicitation/create back-request and returns the result', inputSchema: { type: 'object', properties: {} } },
          { name: '__torture/elicitation-url-probe', description: 'issues a URL-mode elicitation/create back-request', inputSchema: { type: 'object', properties: {} } },
          { name: '__torture/slow-tool', description: 'emits progress notifications over delayMs then returns; supports cancellation', inputSchema: { type: 'object', properties: { delayMs: { type: 'number' } } } },
          { name: '__torture/throw', description: 'always returns an error result', inputSchema: { type: 'object', properties: {} } },
          { name: '__torture/touch-resource', description: 'emits notifications/resources/updated for a subscribed uri then returns', inputSchema: { type: 'object', properties: { uri: { type: 'string' } }, required: ['uri'] } },
          { name: '__torture/touch-tools', description: 'emits notifications/tools/list_changed then returns', inputSchema: { type: 'object', properties: {} } },
        ],
      }))
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
      if (name === '__torture/sampling-probe') {
        void handleSamplingProbe(res, id, cfg, pendingBackRequests)
        return
      }
      if (name === '__torture/elicitation-probe') {
        void handleElicitationProbe(res, id, cfg, pendingBackRequests)
        return
      }
      if (name === '__torture/elicitation-url-probe') {
        void handleElicitationUrlProbe(res, id, cfg, pendingBackRequests)
        return
      }
      if (name === '__torture/slow-tool') {
        void handleSlowTool(res, id, params as Record<string, unknown> | undefined, cfg, pendingCancellations)
        return
      }
      if (name === '__torture/throw') {
        if (has(cfg, 'H-08')) {
          res.status(200).json(jsonRpcError(id, -32603, 'Internal error\n    at handleRequest (/srv/torture/dist/index.js:412:23)\n    at processTicksAndRejections'))
        } else {
          res.status(200).json(jsonRpcError(id, -32603, 'tool threw'))
        }
        return
      }
      if (name === '__torture/touch-resource') {
        void handleTouchResource(res, id, params as Record<string, unknown> | undefined, cfg, subscribers)
        return
      }
      if (name === '__torture/touch-tools') {
        void handleTouchTools(res, id, cfg)
        return
      }
      if (has(cfg, 'TL-08')) {
        res.status(200).json(jsonRpcResult(id, { content: [{ type: 'text', text: 'fake success' }] }))
        return
      }
      res.status(200).json(jsonRpcError(id, -32601, `Unknown tool: ${name}`))
      return
    }
    case 'resources/subscribe': {
      // C-01 violation: no capabilities declared → treat as unsupported method.
      if (has(cfg, 'C-01') && !has(cfg, 'C-06')) { res.status(200).json(jsonRpcError(id, -32601, 'Method not found')); return }
      const subUri = (params as { uri?: unknown } | undefined)?.uri
      if (typeof subUri === 'string') subscribers.add(subUri)
      res.status(200).json(jsonRpcResult(id, {}))
      return
    }
    case 'resources/unsubscribe': {
      // C-01 violation: no capabilities declared → treat as unsupported method.
      if (has(cfg, 'C-01') && !has(cfg, 'C-06')) { res.status(200).json(jsonRpcError(id, -32601, 'Method not found')); return }
      const unsubUri = (params as { uri?: unknown } | undefined)?.uri
      if (typeof unsubUri === 'string') subscribers.delete(unsubUri)
      res.status(200).json(jsonRpcResult(id, {}))
      return
    }
    case 'resources/list':
      if (has(cfg, 'C-02')) { res.status(200).json(jsonRpcResult(id, {})); return }
      if (has(cfg, 'R-01')) { res.status(200).json(jsonRpcResult(id, { resources: [{ uri: 'file://x' }] })); return }
      res.status(200).json(jsonRpcResult(id, { resources: [{ uri: 'file:///readme.md', name: 'readme', mimeType: 'text/plain' }] }))
      return
    case 'resources/read': {
      const readUri = (params as { uri?: unknown } | undefined)?.uri
      if (has(cfg, 'R-04')) {
        // R-04 violation: silently succeed for any URI (should have been an error)
        res.status(200).json(jsonRpcResult(id, { contents: [{}] }))
        return
      }
      if (has(cfg, 'R-07') && readUri === 'file:///readme.md') {
        // R-07 violation: return contents with both text AND blob (invalid shape)
        res.status(200).json(jsonRpcResult(id, { contents: [{ uri: 'file:///readme.md', text: 'hi', blob: 'aGk=', mimeType: 'text/plain' }] }))
        return
      }
      if (readUri !== 'file:///readme.md') {
        // Unknown URI: return JSON-RPC error as required by spec
        res.status(200).json(jsonRpcError(id, -32602, 'Unknown resource URI'))
        return
      }
      res.status(200).json(jsonRpcResult(id, { contents: [{ uri: 'file:///readme.md', text: 'hello', mimeType: 'text/plain' }] }))
      return
    }
    case 'prompts/list':
      if (has(cfg, 'C-03')) { res.status(200).json(jsonRpcResult(id, {})); return }
      if (has(cfg, 'P-01')) { res.status(200).json(jsonRpcResult(id, { prompts: [{}] })); return }
      res.status(200).json(jsonRpcResult(id, { prompts: [
        { name: 'greet' },
        { name: 'echo', description: 'echo prompt', arguments: [{ name: 'msg', description: 'message', required: true }] },
      ] }))
      return
    case 'prompts/get': {
      const promptName = (params as { name?: unknown } | undefined)?.name
      const promptArgs = (params as { arguments?: Record<string, unknown> } | undefined)?.arguments ?? {}
      if (promptName === 'echo') {
        if (has(cfg, 'P-04')) {
          // P-04 violation: ignore missing required arg, return success anyway
          res.status(200).json(jsonRpcResult(id, { messages: [{ role: 'user', content: { type: 'text', text: String(promptArgs.msg ?? '') } }] }))
          return
        }
        // Correct behaviour: error if required arg is missing
        if (typeof promptArgs.msg !== 'string' || promptArgs.msg === '') {
          res.status(200).json(jsonRpcError(id, -32602, 'missing required argument: msg'))
          return
        }
        res.status(200).json(jsonRpcResult(id, { messages: [{ role: 'user', content: { type: 'text', text: promptArgs.msg } }] }))
        return
      }
      // greet (and any other prompt): return default greeting
      res.status(200).json(jsonRpcResult(id, { messages: [{ role: 'user', content: { type: 'text', text: 'Hello!' } }] }))
      return
    }
    case 'logging/setLevel': {
      if (has(cfg, 'C-04')) { res.status(200).json(jsonRpcError(id, -32603, 'Internal error')); return }
      const level = (params as { level?: unknown } | undefined)?.level
      // U-08 violation: reject 'alert' and 'emergency' as if they were unsupported levels.
      if (has(cfg, 'U-08') && (level === 'alert' || level === 'emergency')) {
        res.status(200).json(jsonRpcError(id, -32602, `Unsupported log level: ${String(level)}`))
        return
      }
      res.status(200).json(jsonRpcResult(id, {}))
      return
    }
    case 'completion/complete':
      if (has(cfg, 'C-05')) { res.status(200).json(jsonRpcResult(id, { completion: null })); return }
      res.status(200).json(jsonRpcResult(id, { completion: { values: [], total: 0, hasMore: false } }))
      return
    case '__torture/internal-error':
      if (has(cfg, 'J-09')) {
        res.status(200).json(jsonRpcError(id, -32602, 'wrong code'))
        return
      }
      res.status(200).json(jsonRpcError(id, -32603, 'Internal error'))
      return
    case 'tasks/create': {
      const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const inner = params as { params?: { arguments?: { delayMs?: number } } } | undefined
      const delayMs = inner?.params?.arguments?.delayMs ?? 500
      pendingTasks.set(taskId, { method: 'tools/call', createdAt: Date.now(), delayMs, cancelled: false })
      res.status(200).json(jsonRpcResult(id, { taskId }))
      return
    }
    case 'tasks/status': {
      const taskId = (params as { taskId?: unknown } | undefined)?.taskId as string | undefined
      const task = taskId ? pendingTasks.get(taskId) : undefined
      if (!task) { res.status(200).json(jsonRpcError(id, -32602, 'Unknown taskId')); return }
      // TK-02 violation: always return 'running' so task never reaches terminal status
      if (has(cfg, 'TK-02')) { res.status(200).json(jsonRpcResult(id, { status: 'running' })); return }
      const elapsed = Date.now() - task.createdAt
      const status = elapsed >= task.delayMs ? 'completed' : 'running'
      res.status(200).json(jsonRpcResult(id, { status }))
      return
    }
    default:
      if (has(cfg, 'J-04')) {
        res.status(200).json(jsonRpcError(id, -99999, 'wrong code'))
        return
      }
      if (has(cfg, 'H-01')) {
        // H-01 violation: return empty error message (fails ≥5 char check)
        res.status(200).json(jsonRpcError(id, -32601, ''))
        return
      }
      res.status(200).json(jsonRpcError(id, -32601, 'Method not found'))
      return
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const bad = new Set(process.argv.slice(2).filter((a) => !a.startsWith('--'))) as Set<ViolationId>
  const app = createTortureApp({ violations: bad })
  const port = Number(process.env.PORT ?? '3845')
  app.listen(port, '127.0.0.1', () => {
    console.log(`torture-server on http://127.0.0.1:${port}/mcp (violations=${[...bad].join(',')})`)
  })
}
