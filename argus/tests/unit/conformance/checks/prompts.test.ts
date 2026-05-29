import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import type { ViolationId } from '../../../../../torture-server/src/violations'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import P01 from '@/lib/conformance/checks/prompts/P-01.prompt-shape/check'
import P04 from '@/lib/conformance/checks/prompts/P-04.get-arguments/check'

async function start(violations: string[]): Promise<{ url: string; close: () => Promise<void> }> {
  const app = createTortureApp({ violations: new Set(violations) as unknown as Set<ViolationId> })
  const server: Server = app.listen(0)
  await new Promise<void>((r) => server.once('listening', () => r()))
  const { port } = server.address() as AddressInfo
  return { url: `http://127.0.0.1:${port}/mcp`, close: () => new Promise<void>((r) => server.close(() => r())) }
}

function makeCtx(
  url: string,
  caps: Record<string, unknown> = { prompts: {} },
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

describe('prompts checks', () => {
  // ─── P-01: prompt-shape ──────────────────────────────────────────────────────

  it('P-01 passes when all prompts have valid shape', async () => {
    const s = await start([])
    try {
      const r = await P01.run(makeCtx(s.url, { prompts: {} }))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      expect(r.evidence).toBeDefined()
      expect(Array.isArray((r.evidence as { response?: { body?: { prompts?: unknown } } })?.response?.body?.prompts)).toBe(true)
    } finally {
      await s.close()
    }
  })

  it('P-01 skips when prompts capability not declared', async () => {
    const s = await start([])
    try {
      const r = await P01.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('P-01 fails when a prompt is missing required fields (P-01 violation)', async () => {
    const s = await start(['P-01'])
    try {
      const r = await P01.run(makeCtx(s.url, { prompts: {} }))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/prompt\(s\) malformed/)
      expect(r.evidence).toBeDefined()
      expect(Array.isArray((r.evidence as { actual?: unknown[] })?.actual)).toBe(true)
    } finally {
      await s.close()
    }
  })

  // ─── P-04: get-arguments ─────────────────────────────────────────────────────

  it('P-04 passes when server errors on missing required argument', async () => {
    const s = await start([])
    try {
      const r = await P04.run(makeCtx(s.url, { prompts: {} }))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
      expect(r.evidence).toBeDefined()
      expect(typeof (r.evidence as { actual?: number })?.actual).toBe('number')
    } finally {
      await s.close()
    }
  })

  it('P-04 skips when prompts capability not declared', async () => {
    const s = await start([])
    try {
      const r = await P04.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('P-04 fails when server accepts missing required argument (P-04 violation)', async () => {
    const s = await start(['P-04'])
    try {
      const r = await P04.run(makeCtx(s.url, { prompts: {} }))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/Missing required argument did not produce error/)
      expect(r.evidence).toBeDefined()
      expect((r.evidence as { response?: { body?: unknown } })?.response?.body).toBeDefined()
    } finally {
      await s.close()
    }
  })
})
