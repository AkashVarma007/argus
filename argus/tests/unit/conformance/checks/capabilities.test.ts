import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import C01 from '@/lib/conformance/checks/capabilities/C-01.tools-list/check'
import C02 from '@/lib/conformance/checks/capabilities/C-02.resources-list/check'
import C03 from '@/lib/conformance/checks/capabilities/C-03.prompts-list/check'
import C04 from '@/lib/conformance/checks/capabilities/C-04.logging-setlevel/check'
import C05 from '@/lib/conformance/checks/capabilities/C-05.completion-complete/check'
import C06 from '@/lib/conformance/checks/capabilities/C-06.undeclared-rejected/check'

async function start(violations: string[]): Promise<{ url: string; close: () => Promise<void> }> {
  const app = createTortureApp({ violations: new Set(violations) as never })
  const server: Server = app.listen(0)
  await new Promise<void>((r) => server.once('listening', () => r()))
  const { port } = server.address() as AddressInfo
  return { url: `http://127.0.0.1:${port}/mcp`, close: () => new Promise<void>((r) => server.close(() => r())) }
}

function makeCtx(
  url: string,
  caps: Record<string, unknown> = { tools: {}, resources: {}, prompts: {}, logging: {}, completions: {} },
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

describe('capabilities checks', () => {
  // C-01: tools/list
  it('C-01 passes when tools capability declared and tools/list returns array', async () => {
    const s = await start([])
    try {
      const r = await C01.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('pass')
      expect(r.evidence).toBeDefined()
      expect((r.evidence as { actual?: { toolCount?: number } })?.actual?.toolCount).toBeGreaterThanOrEqual(0)
    } finally {
      await s.close()
    }
  })

  it('C-01 skips when tools capability not declared', async () => {
    const s = await start([])
    try {
      const r = await C01.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('C-01 fails when tools/list returns error (C-01 violation)', async () => {
    const s = await start(['C-01'])
    try {
      const r = await C01.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('fail')
    } finally {
      await s.close()
    }
  })

  // C-02: resources/list
  it('C-02 passes when resources capability declared and resources/list returns array', async () => {
    const s = await start([])
    try {
      const r = await C02.run(makeCtx(s.url, { resources: {} }))
      expect(r.status).toBe('pass')
      expect(r.evidence).toBeDefined()
      expect((r.evidence as { actual?: { resourceCount?: number } })?.actual?.resourceCount).toBeGreaterThanOrEqual(0)
    } finally {
      await s.close()
    }
  })

  it('C-02 skips when resources capability not declared', async () => {
    const s = await start([])
    try {
      const r = await C02.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('C-02 fails when resources/list returns result without resources field', async () => {
    const s = await start(['C-02'])
    try {
      const r = await C02.run(makeCtx(s.url, { resources: {} }))
      expect(r.status).toBe('fail')
    } finally {
      await s.close()
    }
  })

  // C-03: prompts/list
  it('C-03 passes when prompts capability declared and prompts/list returns array', async () => {
    const s = await start([])
    try {
      const r = await C03.run(makeCtx(s.url, { prompts: {} }))
      expect(r.status).toBe('pass')
      expect(r.evidence).toBeDefined()
      expect((r.evidence as { actual?: { promptCount?: number } })?.actual?.promptCount).toBeGreaterThanOrEqual(0)
    } finally {
      await s.close()
    }
  })

  it('C-03 skips when prompts capability not declared', async () => {
    const s = await start([])
    try {
      const r = await C03.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('C-03 fails when prompts/list returns result without prompts field', async () => {
    const s = await start(['C-03'])
    try {
      const r = await C03.run(makeCtx(s.url, { prompts: {} }))
      expect(r.status).toBe('fail')
    } finally {
      await s.close()
    }
  })

  // C-04: logging/setLevel
  it('C-04 passes when logging capability declared and logging/setLevel succeeds', async () => {
    const s = await start([])
    try {
      const r = await C04.run(makeCtx(s.url, { logging: {} }))
      expect(r.status).toBe('pass')
      expect(r.evidence).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('C-04 skips when logging capability not declared', async () => {
    const s = await start([])
    try {
      const r = await C04.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('C-04 fails when logging/setLevel returns JSON-RPC error', async () => {
    const s = await start(['C-04'])
    try {
      const r = await C04.run(makeCtx(s.url, { logging: {} }))
      expect(r.status).toBe('fail')
    } finally {
      await s.close()
    }
  })

  // C-05: completion/complete
  it('C-05 passes when completions capability declared and completion/complete returns result.completion', async () => {
    const s = await start([])
    try {
      const r = await C05.run(makeCtx(s.url, { completions: {} }))
      expect(r.status).toBe('pass')
      expect(r.evidence).toBeDefined()
      expect((r.evidence as { actual?: { completion?: unknown } })?.actual?.completion).toBeDefined()
    } finally {
      await s.close()
    }
  })

  it('C-05 skips when completions capability not declared', async () => {
    const s = await start([])
    try {
      const r = await C05.run(makeCtx(s.url, {}))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })

  it('C-05 fails when completion/complete returns result.completion as null', async () => {
    const s = await start(['C-05'])
    try {
      const r = await C05.run(makeCtx(s.url, { completions: {} }))
      expect(r.status).toBe('fail')
    } finally {
      await s.close()
    }
  })

  // C-06: undeclared tools/list rejected
  it('C-06 passes when server correctly rejects tools/list when tools not declared', async () => {
    // Use C-01 violation: initialize returns empty capabilities, tools/list returns -32601
    const s = await start(['C-01'])
    try {
      // ctx has caps={} so the inline skip guard is not triggered
      const r = await C06.run(makeCtx(s.url, {}))
      expect(r.status).toBe('pass')
      expect((r.evidence as { actual?: { code?: number } })?.actual?.code).toBe(-32601)
    } finally {
      await s.close()
    }
  })

  it('C-06 skips when tools capability is declared', async () => {
    const s = await start([])
    try {
      const r = await C06.run(makeCtx(s.url, { tools: {} }))
      expect(r.status).toBe('skip')
    } finally {
      await s.close()
    }
  })
})
