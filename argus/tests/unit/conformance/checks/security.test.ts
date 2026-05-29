import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import type { ViolationId } from '../../../../../torture-server/src/violations'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import type { Transport, TransportKind } from '@/lib/conformance/transport/types'
import S01 from '@/lib/conformance/checks/security/S-01.origin-validation/check'
import S04 from '@/lib/conformance/checks/security/S-04.tls-required/check'

async function start(violations: string[]): Promise<{ url: string; close: () => Promise<void> }> {
  const app = createTortureApp({ violations: new Set(violations) as unknown as Set<ViolationId> })
  const server: Server = app.listen(0)
  await new Promise<void>((r) => server.once('listening', () => r()))
  const { port } = server.address() as AddressInfo
  return { url: `http://127.0.0.1:${port}/mcp`, close: () => new Promise<void>((r) => server.close(() => r())) }
}

function makeCtx(url: string, transportKind: TransportKind = 'http'): CheckContext {
  const transport = createHttpTransport({ kind: 'http', url, protocolVersion: '2025-11-25' })
  const fakeTransport: Transport = transportKind === 'http' ? transport : { ...transport, kind: 'bridge' as const }
  const rawHttp = createRawHttpClient({ url })
  const client = createMcpClient(transport, '2025-11-25', url)
  return {
    client,
    rawHttp,
    transport: fakeTransport,
    spec: '2025-11-25',
    serverInfo: {} as never,
    capabilities: {} as never,
    log: () => undefined,
  }
}

describe('security checks', () => {
  // ─── S-01: origin-validation ─────────────────────────────────────────────────

  it('S-01 passes when server rejects disallowed Origin with 403', async () => {
    const s = await start([])
    try {
      const r = await S01.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect((r.evidence as { actual?: unknown })?.actual).toBeDefined()
      expect((r.evidence as { actual?: { status?: unknown } })?.actual).toHaveProperty('status')
    } finally {
      await s.close()
    }
  })

  it('S-01 skips for non-HTTP transport (bridge)', async () => {
    const s = await start([])
    try {
      const r = await S01.run(makeCtx(s.url, 'bridge'))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('S-01 fails when server accepts disallowed Origin (T-07 violation)', async () => {
    const s = await start(['T-07'])
    try {
      const r = await S01.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
    } finally {
      await s.close()
    }
  })

  // ─── S-04: tls-required ──────────────────────────────────────────────────────

  it('S-04 passes when endpoint uses HTTPS', () => {
    const url = 'https://example.com/mcp'
    const transport = createHttpTransport({ kind: 'http', url, protocolVersion: '2025-11-25' })
    const rawHttp = createRawHttpClient({ url })
    const client = createMcpClient(transport, '2025-11-25', url)
    const ctx: CheckContext = {
      client, rawHttp, transport,
      spec: '2025-11-25',
      serverInfo: {} as never,
      capabilities: {} as never,
      log: () => undefined,
    }
    return S04.run(ctx).then((r) => {
      expect(r.status).toBe('pass')
      expect((r.evidence as { actual?: unknown })?.actual).toBe('https:')
    })
  })

  it('S-04 skips for loopback endpoints', () => {
    const url = 'http://127.0.0.1:9999/mcp'
    const transport = createHttpTransport({ kind: 'http', url, protocolVersion: '2025-11-25' })
    const rawHttp = createRawHttpClient({ url })
    const client = createMcpClient(transport, '2025-11-25', url)
    const ctx: CheckContext = {
      client, rawHttp, transport,
      spec: '2025-11-25',
      serverInfo: {} as never,
      capabilities: {} as never,
      log: () => undefined,
    }
    return S04.run(ctx).then((r) => {
      expect(r.status).toBe('skip')
      expect(r.message).toMatch(/loopback/i)
    })
  })

  it('S-04 fails when non-loopback endpoint uses HTTP', () => {
    const url = 'http://example.com/mcp'
    const transport = createHttpTransport({ kind: 'http', url, protocolVersion: '2025-11-25' })
    const rawHttp = createRawHttpClient({ url })
    const client = createMcpClient(transport, '2025-11-25', url)
    const ctx: CheckContext = {
      client, rawHttp, transport,
      spec: '2025-11-25',
      serverInfo: {} as never,
      capabilities: {} as never,
      log: () => undefined,
    }
    return S04.run(ctx).then((r) => {
      expect(r.status).toBe('fail')
    })
  })
})
