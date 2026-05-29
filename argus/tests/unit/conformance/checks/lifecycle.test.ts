import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import L01 from '@/lib/conformance/checks/lifecycle/L-01.initialize-result/check'
import L02 from '@/lib/conformance/checks/lifecycle/L-02.server-info-types/check'
import L04 from '@/lib/conformance/checks/lifecycle/L-04.protocol-version-echoed/check'
import L06 from '@/lib/conformance/checks/lifecycle/L-06.initialized-notification/check'
import L09 from '@/lib/conformance/checks/lifecycle/L-09.ping/check'

async function start(violations: string[]): Promise<{ url: string; close: () => Promise<void> }> {
  const app = createTortureApp({ violations: new Set(violations) as never })
  const server: Server = app.listen(0)
  await new Promise<void>((r) => server.once('listening', () => r()))
  const { port } = server.address() as AddressInfo
  const url = `http://127.0.0.1:${port}/mcp`
  return { url, close: () => new Promise<void>((r) => server.close(() => r())) }
}

function makeCtxBare(url: string): CheckContext {
  const transport = createHttpTransport({ kind: 'http', url, protocolVersion: '2025-11-25' })
  const rawHttp = createRawHttpClient({ url })
  const client = createMcpClient(transport, '2025-11-25', url)
  return {
    client, rawHttp, transport,
    spec: '2025-11-25',
    serverInfo: { protocolVersion: '2025-11-25', capabilities: {}, serverInfo: { name: 'torture', version: '0.0.1' } },
    capabilities: {}, log: () => undefined,
  }
}

describe('lifecycle checks', () => {
  it('L-01 passes when initialize result has required fields', async () => {
    const s = await start([])
    const r = await L01.run(makeCtxBare(s.url))
    expect(r.status).toBe('pass')
    expect(r.evidence).toBeDefined()
    expect((r.evidence as { actual?: unknown })?.actual).toEqual(
      expect.arrayContaining(['protocolVersion', 'capabilities', 'serverInfo'])
    )
    await s.close()
  })

  it('L-02 passes when serverInfo name and version are strings', async () => {
    const s = await start([])
    const r = await L02.run(makeCtxBare(s.url))
    expect(r.status).toBe('pass')
    expect(r.evidence).toBeDefined()
    expect((r.evidence as { actual?: { name?: unknown; version?: unknown } })?.actual?.name).toBe('torture')
    await s.close()
  })

  it('L-02 fails when serverInfo has numeric name', async () => {
    const s = await start(['L-02'])
    const r = await L02.run(makeCtxBare(s.url))
    expect(r.status).toBe('fail')
    expect(r.message).toMatch(/name is number/)
    await s.close()
  })

  it('L-04 passes when server echoes requested protocolVersion', async () => {
    const s = await start([])
    const r = await L04.run(makeCtxBare(s.url))
    expect(r.status).toBe('pass')
    expect(r.evidence).toBeDefined()
    expect((r.evidence as { actual?: unknown })?.actual).toBe('2025-11-25')
    await s.close()
  })

  it('L-04 fails when server returns wrong protocolVersion', async () => {
    const s = await start(['L-04'])
    const r = await L04.run(makeCtxBare(s.url))
    expect(r.status).toBe('fail')
    expect((r.evidence as { actual?: unknown })?.actual).toBe('0000-00-00')
    await s.close()
  })

  it('L-06 passes when ping succeeds after initialized notification', async () => {
    const s = await start([])
    const r = await L06.run(makeCtxBare(s.url))
    expect(r.status).toBe('pass')
    expect(r.evidence).toBeDefined()
    await s.close()
  })

  it('L-09 passes when ping succeeds pre-init and post-init', async () => {
    const s = await start([])
    const r = await L09.run(makeCtxBare(s.url))
    expect(r.status).toBe('pass')
    expect(r.evidence).toBeDefined()
    expect((r.evidence as { actual?: { pre?: unknown; post?: unknown } })?.actual?.pre).toBeDefined()
    expect((r.evidence as { actual?: { pre?: unknown; post?: unknown } })?.actual?.post).toBeDefined()
    await s.close()
  })
})
