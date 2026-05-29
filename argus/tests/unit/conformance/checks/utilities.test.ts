import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import type { ViolationId } from '../../../../../torture-server/src/violations'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import U01 from '@/lib/conformance/checks/utilities/U-01.progress-tokens/check'
import U04 from '@/lib/conformance/checks/utilities/U-04.cancellation/check'
import U08 from '@/lib/conformance/checks/utilities/U-08.logging-levels/check'

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

describe('utilities checks', () => {
  // ─── U-01: progress-tokens ───────────────────────────────────────────────────

  it('U-01 passes when slow-tool emits notifications/progress with matching token', async () => {
    const s = await start([])
    try {
      const r = await U01.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThan(0)
      expect(r.evidence).toBeDefined()
      expect((r.evidence as { actual?: unknown })?.actual).toBeGreaterThanOrEqual(1)
    } finally {
      await s.close()
    }
  })

  it('U-01 skips when __torture/slow-tool is not in tools/list', async () => {
    // TL-01: tools/list returns only [{ name: 'incomplete' }] — no slow-tool.
    const s = await start(['TL-01'])
    try {
      const r = await U01.run(makeCtx(s.url))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('U-01 fails when server emits no progress events despite progressToken (U-01 violation)', async () => {
    const s = await start(['U-01'])
    try {
      const r = await U01.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.evidence).toBeDefined()
      expect((r.evidence as { actual?: unknown })?.actual).toBe(0)
    } finally {
      await s.close()
    }
  })

  // ─── U-04: cancellation ──────────────────────────────────────────────────────

  it('U-04 passes when server honours cancellation and resolves promptly', async () => {
    const s = await start([])
    try {
      const r = await U04.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThan(0)
      expect(r.durationMs).toBeLessThan(2500)
    } finally {
      await s.close()
    }
  }, 8000)

  it('U-04 skips when __torture/slow-tool is not in tools/list', async () => {
    const s = await start(['TL-01'])
    try {
      const r = await U04.run(makeCtx(s.url))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('U-04 fails when server ignores cancellation and exceeds timeout (U-04 violation)', async () => {
    const s = await start(['U-04'])
    try {
      const r = await U04.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/did not resolve/)
    } finally {
      await s.close()
    }
  }, 8000)

  // ─── U-08: logging-levels ────────────────────────────────────────────────────

  it('U-08 passes when all 8 RFC 5424 levels are accepted', async () => {
    const s = await start([])
    try {
      const r = await U08.run(makeCtx(s.url, { logging: {} }))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThan(0)
      expect((r.evidence as { actual?: unknown })?.actual).toContain('debug')
    } finally {
      await s.close()
    }
  })

  it('U-08 skips when logging capability is not declared', async () => {
    const s = await start([])
    try {
      const r = await U08.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('U-08 fails when some log levels are rejected (U-08 violation)', async () => {
    const s = await start(['U-08'])
    try {
      const r = await U08.run(makeCtx(s.url, { logging: {} }))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/alert|emergency/)
    } finally {
      await s.close()
    }
  })
})
