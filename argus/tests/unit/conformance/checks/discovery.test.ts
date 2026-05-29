import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import type { ViolationId } from '../../../../../torture-server/src/violations'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import DISC01 from '@/lib/conformance/checks/discovery/DISC-01.well-known-mcp/check'
import DISC02 from '@/lib/conformance/checks/discovery/DISC-02.cors-preflight/check'

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

describe('discovery checks', () => {
  // ─── DISC-01: well-known-mcp ─────────────────────────────────────────────────

  it('DISC-01 passes when /.well-known/mcp returns valid discovery document', async () => {
    const s = await start([])
    try {
      const r = await DISC01.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      expect((r.evidence as { response?: { body?: unknown } })?.response?.body).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('DISC-01 fails when server returns 404 for discovery document (DISC-01 violation)', async () => {
    const s = await start(['DISC-01'])
    try {
      const r = await DISC01.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/HTTP 404/)
      expect(r.evidence).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('DISC-01 skips when transport kind is not http', async () => {
    const s = await start([])
    try {
      const ctx = makeCtx(s.url)
      // Override kind to simulate a non-http transport
      ;(ctx.transport as unknown as Record<string, unknown>).kind = 'bridge'
      const r = await DISC01.run(ctx)
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  // ─── DISC-02: cors-preflight ─────────────────────────────────────────────────

  it('DISC-02 passes when OPTIONS returns proper CORS headers', async () => {
    const s = await start([])
    try {
      const r = await DISC02.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      expect((r.evidence as { actual?: { allowMethods?: string; allowHeaders?: string } })?.actual?.allowMethods).toMatch(/post/)
      expect((r.evidence as { actual?: { allowMethods?: string; allowHeaders?: string } })?.actual?.allowHeaders).toMatch(/mcp-protocol-version/)
    } finally {
      await s.close()
    }
  })

  it('DISC-02 fails when OPTIONS response is missing POST/MCP-Protocol-Version (DISC-02 violation)', async () => {
    const s = await start(['DISC-02'])
    try {
      const r = await DISC02.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/CORS preflight missing/)
      expect(r.evidence).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('DISC-02 skips when transport kind is not http', async () => {
    const s = await start([])
    try {
      const ctx = makeCtx(s.url)
      ;(ctx.transport as unknown as Record<string, unknown>).kind = 'bridge'
      const r = await DISC02.run(ctx)
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  // ─── Network error / closed-port regression ──────────────────────────────────

  it('DISC-01 returns error status when fetch throws (closed port)', async () => {
    const r = await DISC01.run(makeCtx('http://127.0.0.1:1/mcp'))
    expect(r.status).toBe('error')
    expect(r.message).toMatch(/Discovery probe threw:/)
    expect(r.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('DISC-02 returns error status when fetch throws (closed port)', async () => {
    const r = await DISC02.run(makeCtx('http://127.0.0.1:1/mcp'))
    expect(r.status).toBe('error')
    expect(r.message).toMatch(/CORS preflight probe threw:/)
    expect(r.durationMs).toBeGreaterThanOrEqual(0)
  })
})
