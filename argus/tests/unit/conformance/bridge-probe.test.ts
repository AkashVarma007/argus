import { describe, it, expect, beforeEach, vi } from 'vitest'
import { __setWebSocketCtor, probeBridge } from '@/lib/conformance/transport/bridge'

class FakeWS {
  static instances: FakeWS[] = []
  onopen: (() => void) | null = null
  onmessage: ((e: { data: string }) => void) | null = null
  onerror: ((e: unknown) => void) | null = null
  onclose: ((e: { code: number; reason: string }) => void) | null = null
  readyState = 0
  constructor(public url: string) {
    FakeWS.instances.push(this)
  }
  close() { this.readyState = 3 }
  send(_: string) { /* noop */ }
}

beforeEach(() => {
  FakeWS.instances = []
  __setWebSocketCtor(FakeWS as unknown as typeof WebSocket)
})

describe('probeBridge', () => {
  it('returns ok on close code 4001 (missing exec - expected probe response)', async () => {
    const p = probeBridge('ws://127.0.0.1:7879/bridge', { timeoutMs: 500 })
    await new Promise<void>((r) => queueMicrotask(() => r()))
    const ws = FakeWS.instances[0]
    expect(ws.url).toContain('ws://127.0.0.1:7879/bridge')
    expect(ws.url).toContain('exec=')
    expect(ws.url).toContain('protocol=probe')
    ws.onclose?.({ code: 4001, reason: 'missing exec' })
    await expect(p).resolves.toBe('ok')
  })

  it('returns reason string on other close codes', async () => {
    const p = probeBridge('ws://127.0.0.1:7879/bridge', { timeoutMs: 500 })
    await new Promise<void>((r) => queueMicrotask(() => r()))
    const ws = FakeWS.instances[0]
    ws.onclose?.({ code: 1006, reason: 'abnormal' })
    const res = await p
    expect(typeof res).toBe('string')
    expect(res).not.toBe('ok')
    expect(res.toLowerCase()).toMatch(/abnormal|1006/)
  })

  it('returns error string when onerror fires', async () => {
    const p = probeBridge('ws://127.0.0.1:7879/bridge', { timeoutMs: 500 })
    await new Promise<void>((r) => queueMicrotask(() => r()))
    const ws = FakeWS.instances[0]
    ws.onerror?.(new Error('connection refused'))
    const res = await p
    expect(res).not.toBe('ok')
    expect(res.toLowerCase()).toMatch(/refused|error/)
  })

  it('returns ok when no event fires within timeout', async () => {
    vi.useFakeTimers()
    try {
      const p = probeBridge('ws://127.0.0.1:7879/bridge', { timeoutMs: 100 })
      await vi.advanceTimersByTimeAsync(150)
      await expect(p).resolves.toBe('ok')
    } finally {
      vi.useRealTimers()
    }
  })
})
