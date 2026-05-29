import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import type { ViolationId } from '../../../../../torture-server/src/violations'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import SUB01 from '@/lib/conformance/checks/subscriptions/SUB-01.resource-subscribe/check'
import SUB02 from '@/lib/conformance/checks/subscriptions/SUB-02.unsubscribe-stops-events/check'

async function start(violations: string[]): Promise<{ url: string; close: () => Promise<void> }> {
  const app = createTortureApp({ violations: new Set(violations) as unknown as Set<ViolationId> })
  const server: Server = app.listen(0)
  await new Promise<void>((r) => server.once('listening', () => r()))
  const { port } = server.address() as AddressInfo
  return { url: `http://127.0.0.1:${port}/mcp`, close: () => new Promise<void>((r) => server.close(() => r())) }
}

function makeCtx(url: string): CheckContext {
  const transport = createHttpTransport({ kind: 'http', url, protocolVersion: '2025-11-25' })
  const rawHttp = createRawHttpClient({ url })
  const client = createMcpClient(transport, '2025-11-25', url)
  return {
    client,
    rawHttp,
    transport,
    spec: '2025-11-25',
    serverInfo: {} as never,
    capabilities: {},
    log: () => undefined,
  }
}

describe('subscriptions checks', () => {
  // ─── SUB-01: resource-subscribe ───────────────────────────────────────────────

  it('SUB-01 passes when subscribe + touch-resource emits notification', async () => {
    const s = await start([])
    try {
      const r = await SUB01.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      expect((r.evidence as { actual?: unknown })?.actual).toMatch(/1 update/)
    } finally {
      await s.close()
    }
  })

  it('SUB-01 fails when server suppresses update notification (SUB-01 violation)', async () => {
    const s = await start(['SUB-01'])
    try {
      const r = await SUB01.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/No resources\/updated notification/)
      expect((r.evidence as { expected?: unknown; actual?: unknown })?.expected).toBe('≥1 update')
      expect((r.evidence as { actual?: unknown })?.actual).toBe(0)
    } finally {
      await s.close()
    }
  })

  it('SUB-01 skips when server does not support resources/subscribe (C-01 violation)', async () => {
    const s = await start(['C-01'])
    try {
      const r = await SUB01.run(makeCtx(s.url))
      expect(r.status).toBe('skip')
      expect(r.message).toMatch(/subscribe/)
    } finally {
      await s.close()
    }
  })

  // ─── SUB-02: unsubscribe-stops-events ─────────────────────────────────────────

  it('SUB-02 passes when unsubscribe silences further notifications', async () => {
    const s = await start([])
    try {
      const r = await SUB02.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      expect((r.evidence as { actual?: unknown })?.actual).toBe('silenced')
    } finally {
      await s.close()
    }
  })

  it('SUB-02 fails when server still emits notification after unsubscribe (SUB-02 violation)', async () => {
    const s = await start(['SUB-02'])
    try {
      const r = await SUB02.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/notification\(s\) after unsubscribe/)
      expect((r.evidence as { expected?: unknown; actual?: unknown })?.expected).toBe(0)
      expect((r.evidence as { actual?: unknown })?.actual).toBeGreaterThan(0)
    } finally {
      await s.close()
    }
  })

  it('SUB-02 skips when server does not support resources/subscribe (C-01 violation)', async () => {
    const s = await start(['C-01'])
    try {
      const r = await SUB02.run(makeCtx(s.url))
      expect(r.status).toBe('skip')
      expect(r.message).toMatch(/subscribe/)
    } finally {
      await s.close()
    }
  })
})
