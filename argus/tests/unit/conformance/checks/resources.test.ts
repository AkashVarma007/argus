import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import type { ViolationId } from '../../../../../torture-server/src/violations'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import R01 from '@/lib/conformance/checks/resources/R-01.resource-shape/check'
import R04 from '@/lib/conformance/checks/resources/R-04.unknown-uri/check'
import R07 from '@/lib/conformance/checks/resources/R-07.content-types/check'

async function start(violations: string[]): Promise<{ url: string; close: () => Promise<void> }> {
  const app = createTortureApp({ violations: new Set(violations) as unknown as Set<ViolationId> })
  const server: Server = app.listen(0)
  await new Promise<void>((r) => server.once('listening', () => r()))
  const { port } = server.address() as AddressInfo
  return { url: `http://127.0.0.1:${port}/mcp`, close: () => new Promise<void>((r) => server.close(() => r())) }
}

function makeCtx(
  url: string,
  caps: Record<string, unknown> = { resources: {} },
): CheckContext {
  const transport = createHttpTransport({ kind: 'http', url, protocolVersion: '2025-11-25' })
  const rawHttp = createRawHttpClient({ url })
  const client = createMcpClient(transport, '2025-11-25', url)
  return {
    client,
    rawHttp,
    transport,
    spec: '2025-11-25',
    serverInfo: {} as never,
    capabilities: caps,
    log: () => undefined,
  }
}

describe('resources checks', () => {
  // ─── R-01: resource-shape ────────────────────────────────────────────────────

  it('R-01 passes when all resources have uri and name', async () => {
    const s = await start([])
    try {
      const r = await R01.run(makeCtx(s.url, { resources: {} }))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
    } finally {
      await s.close()
    }
  })

  it('R-01 skips when resources capability not declared', async () => {
    const s = await start([])
    try {
      const r = await R01.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('R-01 fails when a resource is missing required fields (R-01 violation)', async () => {
    const s = await start(['R-01'])
    try {
      const r = await R01.run(makeCtx(s.url, { resources: {} }))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/missing required string uri\/name/)
    } finally {
      await s.close()
    }
  })

  // ─── R-04: unknown-uri ───────────────────────────────────────────────────────

  it('R-04 passes when unknown URI returns JSON-RPC error', async () => {
    const s = await start([])
    try {
      const r = await R04.run(makeCtx(s.url, { resources: {} }))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
    } finally {
      await s.close()
    }
  })

  it('R-04 skips when resources capability not declared', async () => {
    const s = await start([])
    try {
      const r = await R04.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('R-04 fails when unknown URI returns success instead of error (R-04 violation)', async () => {
    const s = await start(['R-04'])
    try {
      const r = await R04.run(makeCtx(s.url, { resources: {} }))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/success instead of JSON-RPC error/)
    } finally {
      await s.close()
    }
  })

  // ─── R-07: content-types ─────────────────────────────────────────────────────

  it('R-07 passes when resource contents have text XOR blob plus mimeType', async () => {
    const s = await start([])
    try {
      const r = await R07.run(makeCtx(s.url, { resources: {} }))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
    } finally {
      await s.close()
    }
  })

  it('R-07 skips when resources capability not declared', async () => {
    const s = await start([])
    try {
      const r = await R07.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('R-07 fails when resource contents have both text and blob (R-07 violation)', async () => {
    const s = await start(['R-07'])
    try {
      const r = await R07.run(makeCtx(s.url, { resources: {} }))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/Resource contents shape invalid/)
    } finally {
      await s.close()
    }
  })
})
