import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import type { ViolationId } from '../../../../../torture-server/src/violations'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import EL01 from '@/lib/conformance/checks/elicitation/EL-01.declared-capability/check'
import EL02 from '@/lib/conformance/checks/elicitation/EL-02.form-or-url/check'

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

describe('elicitation checks', () => {
  // ─── EL-01: declared-capability ──────────────────────────────────────────────

  it('EL-01 passes when probe tool present and round-trip succeeds', async () => {
    const s = await start([])
    try {
      const r = await EL01.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      expect(r.evidence).toBeDefined()
      expect((r.evidence as { response?: { body?: unknown } })?.response?.body).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('EL-01 skips when no elicitation-probe tool is available', async () => {
    // TL-01 violation: tools/list returns [{ name: 'incomplete' }] — valid array but no probe tool.
    const s = await start(['TL-01'])
    try {
      const r = await EL01.run(makeCtx(s.url))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('EL-01 fails when server errors on the elicitation probe (EL-01 violation)', async () => {
    const s = await start(['EL-01'])
    try {
      const r = await EL01.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.evidence).toBeDefined()
      expect((r.evidence as { response?: { body?: unknown } })?.response?.body).toBeDefined()
    } finally {
      await s.close()
    }
  })

  // ─── EL-02: form-or-url ──────────────────────────────────────────────────────

  it('EL-02 passes when elicitation/create back-request has requestedSchema only', async () => {
    const s = await start([])
    try {
      const r = await EL02.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      expect(r.evidence).toBeDefined()
      expect((r.evidence as { actual?: unknown })?.actual).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('EL-02 skips when no elicitation-probe tool is available', async () => {
    // TL-01 violation: tools/list returns [{ name: 'incomplete' }] — valid array but no probe tool.
    const s = await start(['TL-01'])
    try {
      const r = await EL02.run(makeCtx(s.url))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('EL-02 fails when elicitation/create back-request has neither requestedSchema nor url (EL-02 violation)', async () => {
    const s = await start(['EL-02'])
    try {
      const r = await EL02.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/neither/)
      expect(r.evidence).toBeDefined()
    } finally {
      await s.close()
    }
  })
})
