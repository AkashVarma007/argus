import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import type { ViolationId } from '../../../../../torture-server/src/violations'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import SMP01 from '@/lib/conformance/checks/sampling/SMP-01.declared-capability/check'
import SMP02 from '@/lib/conformance/checks/sampling/SMP-02.back-request-shape/check'

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

describe('sampling checks', () => {
  // ─── SMP-01: declared-capability ────────────────────────────────────────────

  it('SMP-01 passes when probe tool present and round-trip succeeds', async () => {
    const s = await start([])
    try {
      const r = await SMP01.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      expect(r.evidence).toBeDefined()
      expect((r.evidence as { response?: { body?: unknown } })?.response?.body).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('SMP-01 skips when no sampling-probe tool is available', async () => {
    // TL-01 violation: tools/list returns [{ name: 'incomplete' }] — valid array but no probe tool.
    const s = await start(['TL-01'])
    try {
      const r = await SMP01.run(makeCtx(s.url))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('SMP-01 fails when server errors on the sampling probe (SMP-01 violation)', async () => {
    const s = await start(['SMP-01'])
    try {
      const r = await SMP01.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.evidence).toBeDefined()
      expect((r.evidence as { response?: { body?: unknown } })?.response?.body).toBeDefined()
    } finally {
      await s.close()
    }
  })

  // ─── SMP-02: back-request-shape ──────────────────────────────────────────────

  it('SMP-02 passes when sampling/createMessage back-request has messages array', async () => {
    const s = await start([])
    try {
      const r = await SMP02.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      expect(r.evidence).toBeDefined()
      expect(Array.isArray((r.evidence as { actual?: unknown })?.actual)).toBe(true)
    } finally {
      await s.close()
    }
  })

  it('SMP-02 skips when no sampling-probe tool is available', async () => {
    // TL-01 violation: tools/list returns [{ name: 'incomplete' }] — valid array but no probe tool.
    const s = await start(['TL-01'])
    try {
      const r = await SMP02.run(makeCtx(s.url))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('SMP-02 fails when sampling/createMessage back-request missing messages (SMP-02 violation)', async () => {
    const s = await start(['SMP-02'])
    try {
      const r = await SMP02.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/missing `messages` array/)
      expect(r.evidence).toBeDefined()
    } finally {
      await s.close()
    }
  })
})
