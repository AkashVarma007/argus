import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import type { ViolationId } from '../../../../../torture-server/src/violations'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import H01 from '@/lib/conformance/checks/hygiene/H-01.error-messages-helpful/check'
import H02 from '@/lib/conformance/checks/hygiene/H-02.consistent-types/check'
import H08 from '@/lib/conformance/checks/hygiene/H-08.no-stack-traces/check'

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

describe('hygiene checks', () => {
  // ─── H-01: error-messages-helpful ────────────────────────────────────────────

  it('H-01 passes when server returns a helpful error message for unknown method', async () => {
    const s = await start([])
    try {
      const r = await H01.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect((r.evidence as { actual?: unknown })?.actual).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('H-01 fails when server returns an empty error message (H-01 violation)', async () => {
    const s = await start(['H-01'])
    try {
      const r = await H01.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/short or numeric/)
    } finally {
      await s.close()
    }
  })

  // ─── H-02: consistent-types ───────────────────────────────────────────────────

  it('H-02 passes when tools/list returns stable field types across calls', async () => {
    const s = await start([])
    try {
      const r = await H02.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('pass')
      expect((r.evidence as { actual?: unknown })?.actual).toBe('stable')
    } finally {
      await s.close()
    }
  })

  it('H-02 skips when tools capability is not declared', async () => {
    const s = await start([])
    try {
      const r = await H02.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('H-02 fails when tools/list returns different field types across calls (H-02 violation)', async () => {
    const s = await start(['H-02'])
    try {
      const r = await H02.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/Field type drift/)
    } finally {
      await s.close()
    }
  })

  // ─── H-08: no-stack-traces ────────────────────────────────────────────────────

  it('H-08 passes when error responses do not contain stack trace patterns', async () => {
    const s = await start([])
    try {
      const r = await H08.run(makeCtx(s.url))
      expect(r.status).toBe('pass')
      expect((r.evidence as { actual?: unknown })?.actual).toBe('clean')
    } finally {
      await s.close()
    }
  })

  it('H-08 fails when error response contains a stack trace (H-08 violation)', async () => {
    const s = await start(['H-08'])
    try {
      const r = await H08.run(makeCtx(s.url))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/Stack trace leaked/)
    } finally {
      await s.close()
    }
  })
})
