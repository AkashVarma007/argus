import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import type { TortureAppConfig, MrtrConfig } from '../../../../../torture-server/src/index'
import type { ViolationId } from '../../../../../torture-server/src/violations'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import MRTR01 from '@/lib/conformance/checks/mrtr/MRTR-01.metadata-shape/check'
import MRTR03 from '@/lib/conformance/checks/mrtr/MRTR-03.transport-spec/check'

async function start(
  violations: string[],
  mrtr?: MrtrConfig,
): Promise<{ url: string; close: () => Promise<void> }> {
  const cfg: TortureAppConfig = {
    violations: new Set(violations) as unknown as Set<ViolationId>,
    mrtr,
  }
  const app = createTortureApp(cfg)
  const server: Server = app.listen(0)
  await new Promise<void>((r) => server.once('listening', () => r()))
  const { port } = server.address() as AddressInfo
  return { url: `http://127.0.0.1:${port}/mcp`, close: () => new Promise<void>((r) => server.close(() => r())) }
}

function makeCtx(url: string): CheckContext {
  const transport = createHttpTransport({ kind: 'http', url, protocolVersion: 'DRAFT-2026-v1' })
  const rawHttp = createRawHttpClient({ url })
  const client = createMcpClient(transport, 'DRAFT-2026-v1', url)
  return {
    client,
    rawHttp,
    transport,
    spec: 'DRAFT-2026-v1',
    serverInfo: {} as never,
    capabilities: {},
    log: () => undefined,
  }
}

describe('mrtr checks', () => {
  // ─── MRTR-01: metadata-shape ────────────────────────────────────────────────

  it('MRTR-01 skips when no mrtr metadata declared (default)', async () => {
    const s = await start([])
    try {
      const r = await MRTR01.run(makeCtx(s.url))
      expect(r.status).toBe('skip')
      expect(r.message).toMatch(/No MRTR metadata declared/)
    } finally {
      await s.close()
    }
  })

  it('MRTR-01 passes when mrtr metadata has resources[] and routes[]', async () => {
    const s = await start([], { include: true })
    try {
      const r = await MRTR01.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      const body = (r.evidence as { response?: { body?: unknown } })?.response?.body
      expect(body).toBeTruthy()
    } finally {
      await s.close()
    }
  })

  it('MRTR-01 fails when mrtr metadata is missing resources or routes (malformed)', async () => {
    const s = await start([], { include: true, malformed: true })
    try {
      const r = await MRTR01.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/missing resources\[\] or routes\[\]/)
      expect((r.evidence as { expected?: unknown })?.expected).toBe('{ resources[], routes[] }')
    } finally {
      await s.close()
    }
  })

  // ─── MRTR-03: transport-spec ────────────────────────────────────────────────

  it('MRTR-03 skips when no mrtr.routes declared (default)', async () => {
    const s = await start([])
    try {
      const r = await MRTR03.run(makeCtx(s.url))
      expect(r.status).toBe('skip')
      expect(r.message).toMatch(/No MRTR routes/)
    } finally {
      await s.close()
    }
  })

  it('MRTR-03 passes when all routes use allowed transports', async () => {
    const s = await start([], { include: true })
    try {
      const r = await MRTR03.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      const body = (r.evidence as { response?: { body?: unknown } })?.response?.body
      expect(Array.isArray(body)).toBe(true)
    } finally {
      await s.close()
    }
  })

  it('MRTR-03 fails when a route has a disallowed transport (badTransport)', async () => {
    const s = await start([], { include: true, badTransport: true })
    try {
      const r = await MRTR03.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/route\(s\) with disallowed transport/)
      expect((r.evidence as { expected?: unknown })?.expected).toBe('http|sse|stdio')
    } finally {
      await s.close()
    }
  })

  // ─── MRTR-03 regression: non-array routes must skip, not crash ─────────────

  it('MRTR-03 skips (not crash) when mrtr.routes is a non-array truthy value (malformedRoutes)', async () => {
    const s = await start([], { include: true, malformedRoutes: true })
    try {
      const r = await MRTR03.run(makeCtx(s.url))
      expect(r.status).toBe('skip')
      expect(r.message).toMatch(/No MRTR routes/)
    } finally {
      await s.close()
    }
  })
})
