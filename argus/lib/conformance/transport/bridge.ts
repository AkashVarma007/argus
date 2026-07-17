import type { JsonRpcRequest, JsonRpcNotification, JsonRpcResponse, JsonRpcId } from '../helpers/jsonrpc'
import { isJsonRpcResponse } from '../helpers/jsonrpc'
import type { Transport, TransportConfig } from './types'

type WSCtor = new (url: string) => WebSocket
let _WS: WSCtor = globalThis.WebSocket as unknown as WSCtor

export function __setWebSocketCtor(ctor: WSCtor): void { _WS = ctor }

interface ProbeOpts { timeoutMs?: number }

export function probeBridge(bridgeUrl: string, opts: ProbeOpts = {}): Promise<'ok' | string> {
  const timeoutMs = opts.timeoutMs ?? 1500
  const url = `${bridgeUrl}?exec=&protocol=probe`
  return new Promise<'ok' | string>((resolve) => {
    let done = false
    const finish = (v: 'ok' | string) => {
      if (done) return
      done = true
      clearTimeout(timer)
      try { ws.close() } catch { /* already closed */ }
      resolve(v)
    }
    const timer = setTimeout(() => finish('ok'), timeoutMs)
    const ws = new _WS(url)
    ws.onclose = (e: CloseEvent) => {
      const code = e?.code ?? 0
      if (code === 4001) finish('ok')
      else finish(e?.reason || `bridge closed (code ${code})`)
    }
    ws.onerror = (e: Event) => {
      const msg = (e as Event & { message?: string })?.message
      finish(msg || `bridge error: ${e?.type ?? 'unknown'}`)
    }
  })
}

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
      if (ws.readyState !== 1) throw new Error('bridge socket is closed')
      return new Promise<JsonRpcResponse>((resolve, reject) => {
        pending.set(req.id, { resolve, reject })
        ws.send(JSON.stringify(req))
      })
    },
    async notify(n: JsonRpcNotification): Promise<void> {
      await opened
      if (ws.readyState !== 1) throw new Error('bridge socket is closed')
      ws.send(JSON.stringify(n))
    },
    async close() {
      try { ws.close() } catch { /* already closed */ }
    },
  }
}
