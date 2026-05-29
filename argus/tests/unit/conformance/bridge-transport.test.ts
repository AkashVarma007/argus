import { describe, it, expect, beforeEach } from 'vitest'
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
    await new Promise<void>(r => queueMicrotask(() => r()))
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
    await new Promise<void>(r => queueMicrotask(() => r()))
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
    await new Promise<void>(r => queueMicrotask(() => r()))
    ws.close()
    await expect(p).rejects.toThrow(/bridge closed/i)
  })

  it('rejects send when called after close', async () => {
    const t = createBridgeTransport({
      kind: 'bridge',
      url: 'ws://127.0.0.1:7879/bridge',
      protocolVersion: '2025-11-25',
      bridgeCommand: 'python s.py',
    })
    // wait for open
    await new Promise<void>(r => queueMicrotask(() => r()))
    const ws = FakeWebSocket.instances[0]
    ws.close()
    await expect(t.send(buildRequest('ping', undefined, 5))).rejects.toThrow(/closed/i)
  })
})
