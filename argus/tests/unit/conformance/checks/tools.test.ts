import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import type { ViolationId } from '../../../../../torture-server/src/violations'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import TL01 from '@/lib/conformance/checks/tools/TL-01.tool-shape/check'
import TL02 from '@/lib/conformance/checks/tools/TL-02.input-schema-valid/check'
import TL05 from '@/lib/conformance/checks/tools/TL-05.unique-names/check'
import TL08 from '@/lib/conformance/checks/tools/TL-08.missing-tool/check'
import TL09 from '@/lib/conformance/checks/tools/TL-09.invalid-input/check'

async function start(violations: string[]): Promise<{ url: string; close: () => Promise<void> }> {
  const app = createTortureApp({ violations: new Set(violations) as Set<ViolationId> })
  const server: Server = app.listen(0)
  await new Promise<void>((r) => server.once('listening', () => r()))
  const { port } = server.address() as AddressInfo
  return { url: `http://127.0.0.1:${port}/mcp`, close: () => new Promise<void>((r) => server.close(() => r())) }
}

function makeCtx(
  url: string,
  caps: Record<string, unknown> = { tools: {} },
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

describe('tools checks', () => {
  // ─── TL-01: tool-shape ──────────────────────────────────────────────────────

  it('TL-01 passes when all tools have name, description, inputSchema', async () => {
    const s = await start([])
    try {
      const r = await TL01.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
    } finally {
      await s.close()
    }
  })

  it('TL-01 skips when tools capability not declared', async () => {
    const s = await start([])
    try {
      const r = await TL01.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('TL-01 fails when a tool is missing required fields (TL-01 violation)', async () => {
    const s = await start(['TL-01'])
    try {
      const r = await TL01.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/missing required fields/)
    } finally {
      await s.close()
    }
  })

  // ─── TL-02: input-schema-valid ───────────────────────────────────────────────

  it('TL-02 passes when all inputSchemas are valid JSON Schema', async () => {
    const s = await start([])
    try {
      const r = await TL02.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
    } finally {
      await s.close()
    }
  })

  it('TL-02 skips when tools capability not declared', async () => {
    const s = await start([])
    try {
      const r = await TL02.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('TL-02 fails when inputSchema has invalid keyword', async () => {
    const stubClient = {
      call: async () => ({
        result: { tools: [{ name: 't', description: 'd', inputSchema: { type: 'object', $ref: 1 } }] },
        raw: {},
      }),
    } as never
    const ctx = {
      client: stubClient,
      rawHttp: {} as never,
      transport: {} as never,
      spec: '2025-11-25',
      serverInfo: {} as never,
      capabilities: { tools: {} },
      log: () => undefined,
    } as never
    const r = await TL02.run(ctx)
    expect(r.status).toBe('fail')
  })

  // ─── TL-05: unique-names ─────────────────────────────────────────────────────

  it('TL-05 passes when all tool names are unique', async () => {
    const s = await start([])
    try {
      const r = await TL05.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
    } finally {
      await s.close()
    }
  })

  it('TL-05 skips when tools capability not declared', async () => {
    const s = await start([])
    try {
      const r = await TL05.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('TL-05 fails when tools list contains duplicate names (TL-05 violation)', async () => {
    const s = await start(['TL-05'])
    try {
      const r = await TL05.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/dup/)
    } finally {
      await s.close()
    }
  })

  // ─── TL-08: missing-tool ─────────────────────────────────────────────────────

  it('TL-08 passes when unknown tool returns JSON-RPC error', async () => {
    const s = await start([])
    try {
      const r = await TL08.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
    } finally {
      await s.close()
    }
  })

  it('TL-08 skips when tools capability not declared', async () => {
    const s = await start([])
    try {
      const r = await TL08.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('TL-08 fails when unknown tool returns fake success result (TL-08 violation)', async () => {
    const s = await start(['TL-08'])
    try {
      const r = await TL08.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/success result instead of JSON-RPC error/)
    } finally {
      await s.close()
    }
  })

  // ─── TL-09: invalid-input ────────────────────────────────────────────────────

  it('TL-09 passes when schema-violating call returns result.isError: true', async () => {
    const s = await start([])
    try {
      const r = await TL09.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('pass')
      expect(r.durationMs).toBeGreaterThanOrEqual(0)
    } finally {
      await s.close()
    }
  })

  it('TL-09 skips when tools capability not declared', async () => {
    const s = await start([])
    try {
      const r = await TL09.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('TL-09 fails when schema-violating call returns JSON-RPC -32602 instead of isError (TL-09 violation)', async () => {
    const s = await start(['TL-09'])
    try {
      const r = await TL09.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('fail')
      expect(r.message).toMatch(/-32602/)
    } finally {
      await s.close()
    }
  })
})
