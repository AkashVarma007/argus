import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import type { ViolationId } from '../../../../../torture-server/src/violations'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import SL01 from '@/lib/conformance/checks/stateless/SL-01.no-session-cookie/check'
import SL02 from '@/lib/conformance/checks/stateless/SL-02.identical-result-after-reconnect/check'

async function start(violations: string[]): Promise<{ url: string; close: () => Promise<void> }> {
  const app = createTortureApp({ violations: new Set(violations) as unknown as Set<ViolationId> })
  const server: Server = app.listen(0)
  await new Promise<void>((r) => server.once('listening', () => r()))
  const { port } = server.address() as AddressInfo
  return { url: `http://127.0.0.1:${port}/mcp`, close: () => new Promise<void>((r) => server.close(() => r())) }
}

function makeCtx(url: string, caps: Record<string, unknown> = {}): CheckContext {
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

describe('stateless checks', () => {
  // ─── SL-01: no-session-cookie ─────────────────────────────────────────────────

  it('SL-01 passes when server does not set a session cookie', async () => {
    const s = await start([])
    try {
      const r = await SL01.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      expect((r.evidence as { actual?: unknown })?.actual).toMatch(/no Set-Cookie/)
    } finally {
      await s.close()
    }
  })

  it('SL-01 fails when server sets a session cookie (SL-01 violation)', async () => {
    const s = await start(['SL-01'])
    try {
      const r = await SL01.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/cookie/)
      expect((r.evidence as { actual?: unknown })?.actual).toBeTruthy()
    } finally {
      await s.close()
    }
  })

  it('SL-01 skips when transport kind is not http', async () => {
    const s = await start([])
    try {
      const ctx = makeCtx(s.url)
      ;(ctx.transport as unknown as Record<string, unknown>).kind = 'bridge'
      const r = await SL01.run(ctx)
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('SL-01 returns error status when fetch throws (closed port)', async () => {
    const r = await SL01.run(makeCtx('http://127.0.0.1:1/mcp'))
    expect(r.status).toBe('error')
    expect(r.message).toMatch(/SL-01 probe threw:/)
    expect(r.durationMs).toBeGreaterThanOrEqual(0)
  })

  // ─── SL-02: identical-result-after-reconnect ──────────────────────────────────

  it('SL-02 passes when tools/list is identical across a fresh connection', async () => {
    const s = await start([])
    try {
      const r = await SL02.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThan(0)
      expect((r.evidence as { actual?: unknown })?.actual).toMatch(/identical/)
    } finally {
      await s.close()
    }
  })

  it('SL-02 fails when tools/list differs across connections (SL-02 violation)', async () => {
    const s = await start(['SL-02'])
    try {
      const r = await SL02.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/differed/)
    } finally {
      await s.close()
    }
  })

  it('SL-02 skips when tools capability is not declared', async () => {
    const s = await start([])
    try {
      const r = await SL02.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
      expect(r.message).toMatch(/tools capability not declared/)
    } finally {
      await s.close()
    }
  })

  it('SL-02 skips when transport kind is not http', async () => {
    const s = await start([])
    try {
      const ctx = makeCtx(s.url, { tools: {} })
      ;(ctx.transport as unknown as Record<string, unknown>).kind = 'bridge'
      const r = await SL02.run(ctx)
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })
})
