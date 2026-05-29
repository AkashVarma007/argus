import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import type { ViolationId } from '../../../../../torture-server/src/violations'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import TK01 from '@/lib/conformance/checks/tasks/TK-01.task-support-declared/check'
import TK02 from '@/lib/conformance/checks/tasks/TK-02.task-status-poll/check'

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

describe('tasks checks', () => {
  // ─── TK-01: task-support-declared ────────────────────────────────────────────

  it('TK-01 passes when no tools have taskSupport set', async () => {
    const s = await start([])
    try {
      const r = await TK01.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThan(0)
      expect((r.evidence as { response?: { body?: unknown } })?.response?.body).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('TK-01 skips when tools capability is not declared', async () => {
    const s = await start([])
    try {
      const r = await TK01.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('TK-01 fails when a tool has an invalid taskSupport value (TK-01 violation)', async () => {
    const s = await start(['TK-01'])
    try {
      const r = await TK01.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/taskSupport/)
    } finally {
      await s.close()
    }
  })

  // ─── TK-02: task-status-poll ─────────────────────────────────────────────────

  it('TK-02 passes when task reaches terminal status within polling window', async () => {
    const s = await start([])
    try {
      const r = await TK02.run(makeCtx(s.url, { tasks: { list: {}, cancel: {} } }))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThan(0)
      const actual = (r.evidence as { actual?: unknown })?.actual
      expect(['completed', 'failed', 'cancelled']).toContain(actual)
    } finally {
      await s.close()
    }
  }, 8000)

  it('TK-02 skips when tasks capability is not declared', async () => {
    const s = await start([])
    try {
      const r = await TK02.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('TK-02 fails when task never reaches terminal status (TK-02 violation)', async () => {
    const s = await start(['TK-02'])
    try {
      const r = await TK02.run(makeCtx(s.url, { tasks: { list: {}, cancel: {} } }))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/never reached terminal status/)
    } finally {
      await s.close()
    }
  }, 10000)
})
