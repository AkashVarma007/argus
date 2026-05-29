import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import type { ViolationId } from '../../../../../torture-server/src/violations'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import CACHE01 from '@/lib/conformance/checks/caching/CACHE-01.list-stable-without-changed/check'
import CACHE05 from '@/lib/conformance/checks/caching/CACHE-05.list-changed-after-touch/check'

async function start(violations: string[]): Promise<{ url: string; close: () => Promise<void> }> {
  const app = createTortureApp({ violations: new Set(violations) as unknown as Set<ViolationId> })
  const server: Server = app.listen(0)
  await new Promise<void>((r) => server.once('listening', () => r()))
  const { port } = server.address() as AddressInfo
  return { url: `http://127.0.0.1:${port}/mcp`, close: () => new Promise<void>((r) => server.close(() => r())) }
}

function makeCtx(url: string, caps: Record<string, unknown> = { tools: {} }): CheckContext {
  const transport = createHttpTransport({ kind: 'http', url, protocolVersion: '2025-11-25' })
  const rawHttp = createRawHttpClient({ url })
  const client = createMcpClient(transport, '2025-11-25', url)
  return {
    client,
    rawHttp,
    transport,
    spec: '2025-11-25',
    serverInfo: {} as never,
    capabilities: caps as never,
    log: () => undefined,
  }
}

describe('caching checks', () => {
  // ─── CACHE-01: list-stable-without-changed ─────────────────────────────────

  it('CACHE-01 passes when tools/list is byte-stable across consecutive calls', async () => {
    const s = await start([])
    try {
      const r = await CACHE01.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      expect((r.evidence as { actual?: unknown })?.actual).toBe('stable')
    } finally {
      await s.close()
    }
  })

  it('CACHE-01 fails when tools/list varies across consecutive calls (CACHE-01 violation)', async () => {
    const s = await start(['CACHE-01'])
    try {
      const r = await CACHE01.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/differed between consecutive calls/)
      expect((r.evidence as { expected?: unknown; actual?: unknown })?.expected).toBe('identical')
      expect((r.evidence as { actual?: unknown })?.actual).toBeTruthy()
    } finally {
      await s.close()
    }
  })

  // ─── CACHE-05: list-changed-after-touch ────────────────────────────────────

  it('CACHE-05 passes when touch-tools fires notifications/tools/list_changed', async () => {
    const s = await start([])
    try {
      const r = await CACHE05.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      expect((r.evidence as { actual?: unknown })?.actual).toBeGreaterThan(0)
    } finally {
      await s.close()
    }
  })

  it('CACHE-05 fails when server suppresses list_changed notification (CACHE-05 violation)', async () => {
    const s = await start(['CACHE-05'])
    try {
      const r = await CACHE05.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/No list_changed notification/)
      expect((r.evidence as { expected?: unknown })?.expected).toBe('≥1 list_changed')
      expect((r.evidence as { actual?: unknown })?.actual).toBe(0)
    } finally {
      await s.close()
    }
  })

  it('CACHE-05 errors when the server is unreachable', async () => {
    const r = await CACHE05.run(makeCtx('http://127.0.0.1:1/mcp'))
    expect(r.status).toBe('error')
    expect(r.message).toMatch(/CACHE-05 probe threw:/)
    expect(r.durationMs).toBeGreaterThanOrEqual(0)
  })

  // ─── CACHE-01 regression: JSON-RPC error must not silently pass ────────────

  it('CACHE-01 returns error (not pass) when tools/list returns a JSON-RPC error (C-01 violation)', async () => {
    // C-01 removes the tools capability; tools/list then returns a JSON-RPC error.
    // Previously both a.result and b.result were undefined, JSON.stringify produced "undefined"==="undefined" → false pass.
    const s = await start(['C-01'])
    try {
      // Pass empty capabilities so CACHE-01 is not capability-gated in this test.
      const r = await CACHE01.run(makeCtx(s.url, {}))
      expect(r.status).toBe('error')
      expect(r.message).toMatch(/tools\/list returned error/)
    } finally {
      await s.close()
    }
  })
})
