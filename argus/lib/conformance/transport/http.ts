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

function isServerInitiatedRequest(v: unknown): v is JsonRpcRequest {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return o.jsonrpc === '2.0' && typeof o.method === 'string' && o.id !== undefined && !('result' in o) && !('error' in o)
}

function isServerInitiatedNotification(v: unknown): v is JsonRpcNotification {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return o.jsonrpc === '2.0' && typeof o.method === 'string' && o.id === undefined && !('result' in o) && !('error' in o)
}

export function createHttpTransport(cfg: TransportConfig): Transport {
  // Mutable handler refs so client can update them after transport creation.
  let serverRequestHandler: ((req: JsonRpcRequest) => unknown | Promise<unknown>) | null =
    cfg.onServerRequest ?? null
  let serverNotificationHandler: ((notification: JsonRpcNotification) => void) | null =
    cfg.onServerNotification ?? null

  return {
    kind: 'http',

    setServerRequestHandler(fn: ((req: JsonRpcRequest) => unknown | Promise<unknown>) | null) {
      serverRequestHandler = fn
    },

    setServerNotificationHandler(fn: ((notification: JsonRpcNotification) => void) | null) {
      serverNotificationHandler = fn
    },

    async send(req: JsonRpcRequest): Promise<JsonRpcResponse> {
      const body = JSON.stringify(req)
      const headers = mandatoryHeaders(cfg)
      const res = await postViaProxy(cfg, body, headers)
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
      }
      const contentType = res.headers.get('content-type') ?? ''
      if (contentType.includes('text/event-stream')) {
        if (!res.body) throw new Error('SSE response without body')

        let found: JsonRpcResponse | undefined
        const events = await collectSseEvents(res.body, {
          stopAtResponseId: req.id,
          timeoutMs: 30_000,
          onEvent: (e) => {
            let parsed: Record<string, unknown>
            try { parsed = JSON.parse(e.data) as Record<string, unknown> } catch { return }

            // Server→client request: respond and continue collecting.
            if (isServerInitiatedRequest(parsed)) {
              const handler = serverRequestHandler
              if (handler) {
                const srvReq = parsed as unknown as JsonRpcRequest
                // Fire-and-forget the back-POST; we must not await inside onEvent.
                void Promise.resolve(handler(srvReq))
                  .then((result) => {
                    const responseBody = JSON.stringify({ jsonrpc: '2.0', id: srvReq.id, result })
                    return postViaProxy(cfg, responseBody, mandatoryHeaders(cfg))
                  })
                  .catch((err: unknown) => {
                    console.error('[argus] back-request response failed:', err)
                  })
              }
              return
            }

            // Server→client notification (has method, no id): dispatch and continue.
            if (isServerInitiatedNotification(parsed)) {
              serverNotificationHandler?.(parsed as unknown as JsonRpcNotification)
              return
            }

            if (isJsonRpcResponse(parsed) && (parsed as { id: unknown }).id === req.id) {
              found = parsed as JsonRpcResponse
            }
          },
        })

        if (found) return found

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
