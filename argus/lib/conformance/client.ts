import { buildNotification, buildRequest, isJsonRpcError, isJsonRpcSuccess, nextId } from './helpers/jsonrpc'
import type { JsonRpcNotification, JsonRpcRequest, JsonRpcResponse } from './helpers/jsonrpc'
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
  initialize(protocolVersion?: string): Promise<InitializeResult>
  notifyInitialized(): Promise<void>
  call(method: string, params?: unknown): Promise<CallOutcome>
  /** Build the request with a caller-provided id; lets callers know the id ahead of time (needed for cancellation). */
  callWithId(id: string | number, method: string, params?: unknown): Promise<CallOutcome>
  notify(method: string, params?: unknown): Promise<void>
  onRequest(handler: ((req: JsonRpcRequest) => unknown | Promise<unknown>) | null): void
  onNotification(handler: ((n: JsonRpcNotification) => void) | null): void
  /** Consumes and returns the next monotonic request id (for callers that need the id before sending, e.g. cancellation). */
  nextRequestId(): number
  close(): Promise<void>
}

export function createMcpClient(transport: Transport, spec: SpecVersion, url = ''): McpClient {
  const state: { caps: ServerCapabilities; info: InitializeResult['serverInfo'] | null } = {
    caps: {},
    info: null,
  }

  // Shared mutable refs: transport reads these when it intercepts server→client messages.
  const requestHandlerRef: { fn: ((req: JsonRpcRequest) => unknown | Promise<unknown>) | null } = { fn: null }
  const notificationHandlerRef: { fn: ((n: JsonRpcNotification) => void) | null } = { fn: null }

  // If the transport supports injecting server-message callbacks, wire them up now.
  if ('setServerRequestHandler' in transport && typeof (transport as { setServerRequestHandler?: unknown }).setServerRequestHandler === 'function') {
    (transport as { setServerRequestHandler: (fn: typeof requestHandlerRef['fn']) => void }).setServerRequestHandler(
      (req: JsonRpcRequest) => requestHandlerRef.fn?.(req) ?? undefined,
    )
  }
  if ('setServerNotificationHandler' in transport && typeof (transport as { setServerNotificationHandler?: unknown }).setServerNotificationHandler === 'function') {
    (transport as { setServerNotificationHandler: (fn: ((n: JsonRpcNotification) => void) | null) => void }).setServerNotificationHandler(
      (n: JsonRpcNotification) => notificationHandlerRef.fn?.(n),
    )
  }

  return {
    url,
    spec,
    get capabilities() { return state.caps },
    get serverInfo() { return state.info },
    set capabilities(c) { state.caps = c },
    set serverInfo(i) { state.info = i },

    onRequest(handler: ((req: JsonRpcRequest) => unknown | Promise<unknown>) | null): void {
      requestHandlerRef.fn = handler
    },

    onNotification(handler: ((n: JsonRpcNotification) => void) | null): void {
      notificationHandlerRef.fn = handler
    },

    nextRequestId(): number {
      return nextId()
    },

    async initialize(protocolVersion?: string): Promise<InitializeResult> {
      const req = buildRequest('initialize', {
        protocolVersion: protocolVersion ?? spec,
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
      if (isJsonRpcError(res)) return { error: res.error, raw: res }
      throw new Error(`unrecognized JSON-RPC response shape: ${JSON.stringify(res)}`)
    },

    async callWithId(id: string | number, method: string, params?: unknown): Promise<CallOutcome> {
      const req = buildRequest(method, params, id)
      const res = await transport.send(req)
      if (isJsonRpcSuccess(res)) return { result: res.result, raw: res }
      if (isJsonRpcError(res)) return { error: res.error, raw: res }
      throw new Error(`unrecognized JSON-RPC response shape: ${JSON.stringify(res)}`)
    },

    async notify(method: string, params?: unknown): Promise<void> {
      await transport.notify(buildNotification(method, params))
    },

    async close() { await transport.close() },
  }
}
