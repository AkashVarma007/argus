import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import type { ViolationId } from '../../../../../torture-server/src/violations'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import RC01 from '@/lib/conformance/checks/rc/RC-01.draft-2026-v1-supported/check'
import RC02 from '@/lib/conformance/checks/rc/RC-02.icons-typed/check'
import RC03 from '@/lib/conformance/checks/rc/RC-03.url-mode-elicitation/check'

async function start(violations: string[]): Promise<{ url: string; close: () => Promise<void> }> {
  const app = createTortureApp({ violations: new Set(violations) as unknown as Set<ViolationId> })
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

describe('rc checks', () => {
  // ─── RC-01: draft-2026-v1-supported ──────────────────────────────────────────

  it('RC-01 passes when server echoes DRAFT-2026-v1 protocolVersion', async () => {
    const s = await start([])
    try {
      const r = await RC01.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      expect((r.evidence as { response?: { body?: unknown } })?.response?.body).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('RC-01 fails when server returns wrong protocolVersion (RC-01 violation)', async () => {
    const s = await start(['RC-01'])
    try {
      const r = await RC01.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/Expected DRAFT-2026-v1/)
      expect(r.evidence).toBeDefined()
    } finally {
      await s.close()
    }
  })

  // ─── RC-02: icons-typed ───────────────────────────────────────────────────────

  it('RC-02 passes when serverInfo.icons is well-formed', async () => {
    const s = await start([])
    try {
      const r = await RC02.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      expect((r.evidence as { response?: { body?: unknown } })?.response?.body).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('RC-02 fails when serverInfo.icons has malformed url (RC-02 violation)', async () => {
    const s = await start(['RC-02'])
    try {
      const r = await RC02.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/icon entries malformed/)
      expect(r.evidence).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('RC-02 does not throw when icons array contains a null entry', async () => {
    const s = await start([])
    try {
      const ctx = makeCtx(s.url)
      const orig = ctx.client.initialize.bind(ctx.client)
      ctx.client.initialize = async (...args) => {
        const result = await orig(...args)
        // Inject a null entry alongside valid ones to simulate primitive icon entry
        ;(result.serverInfo as Record<string, unknown>)['icons'] = [null, { url: 'https://example.com/icon.png' }]
        return result
      }
      const r = await RC02.run(ctx)
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/icon entries malformed/)
    } finally {
      await s.close()
    }
  })

  // ─── RC-03: url-mode-elicitation ─────────────────────────────────────────────

  it('RC-03 passes when URL-mode elicitation uses https URL', async () => {
    const s = await start([])
    try {
      const r = await RC03.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      expect((r.evidence as { actual?: unknown })?.actual).toMatch(/^https:\/\//)
    } finally {
      await s.close()
    }
  })

  it('RC-03 skips when no __torture/elicitation-url-probe tool is available', async () => {
    // TL-01 violation: tools/list returns [{ name: 'incomplete' }] — valid array but no url-probe tool.
    const s = await start(['TL-01'])
    try {
      const r = await RC03.run(makeCtx(s.url))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('RC-03 fails when URL-mode elicitation uses http URL (RC-03 violation)', async () => {
    const s = await start(['RC-03'])
    try {
      const r = await RC03.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/must be https/)
      expect(r.evidence).toBeDefined()
    } finally {
      await s.close()
    }
  })
})
