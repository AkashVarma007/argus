import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import T01 from '@/lib/conformance/checks/transport/T-01.content-type-json/check'
import T03 from '@/lib/conformance/checks/transport/T-03.response-content-type/check'
import T05 from '@/lib/conformance/checks/transport/T-05.notification-202/check'
import T07 from '@/lib/conformance/checks/transport/T-07.origin-validation/check'
import T12 from '@/lib/conformance/checks/transport/T-12.protocol-version-header/check'
import T13 from '@/lib/conformance/checks/transport/T-13.protocol-version-rejected/check'

async function start(violations: string[]): Promise<{ url: string; close: () => Promise<void> }> {
  const app = createTortureApp({ violations: new Set(violations) as never })
  const server: Server = app.listen(0)
  await new Promise<void>((r) => server.once('listening', () => r()))
  const { port } = server.address() as AddressInfo
  const url = `http://127.0.0.1:${port}/mcp`
  return { url, close: () => new Promise<void>((r) => server.close(() => r())) }
}

async function makeCtx(url: string): Promise<CheckContext> {
  const transport = createHttpTransport({ kind: 'http', url, protocolVersion: '2025-11-25' })
  const rawHttp = createRawHttpClient({ url })
  const client = createMcpClient(transport, '2025-11-25', url)
  const init = await client.initialize()
  return {
    client, rawHttp, transport,
    spec: '2025-11-25', serverInfo: init,
    capabilities: init.capabilities, log: () => undefined,
  }
}

describe('transport checks', () => {
  it('T-01 passes when server accepts application/json', async () => {
    const s = await start([])
    const r = await T01.run(await makeCtx(s.url))
    expect(r.status).toBe('pass')
    await s.close()
  })

  it('T-01 fails when server returns 415 to application/json', async () => {
    const s = await start(['T-01'])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await T01.run(ctx)
    expect(r.status).toBe('fail')
    await s.close()
  })

  it('T-03 passes for application/json responses', async () => {
    const s = await start([])
    const r = await T03.run(await makeCtx(s.url))
    expect(r.status).toBe('pass')
    await s.close()
  })

  it('T-03 fails when content-type is text/plain', async () => {
    const s = await start(['T-03'])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await T03.run(ctx)
    expect(r.status).toBe('fail')
    await s.close()
  })

  it('T-05 passes when notification returns 202', async () => {
    const s = await start([])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await T05.run(ctx)
    expect(r.status).toBe('pass')
    await s.close()
  })

  it('T-05 fails when notification returns 200', async () => {
    const s = await start(['T-05'])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await T05.run(ctx)
    expect(r.status).toBe('fail')
    await s.close()
  })

  it('T-07 passes when foreign Origin is 403', async () => {
    const s = await start([])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await T07.run(ctx)
    expect(r.status).toBe('pass')
    await s.close()
  })

  it('T-07 fails when foreign Origin is accepted', async () => {
    const s = await start(['T-07'])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await T07.run(ctx)
    expect(r.status).toBe('fail')
    await s.close()
  })

  it('T-12 passes when MCP-Protocol-Version header is required', async () => {
    const s = await start([])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await T12.run(ctx)
    expect(r.status).toBe('pass')
    await s.close()
  })

  it('T-13 passes when bad MCP-Protocol-Version is rejected', async () => {
    const s = await start([])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await T13.run(ctx)
    expect(r.status).toBe('pass')
    await s.close()
  })

  it('T-13 fails when bogus MCP-Protocol-Version is accepted', async () => {
    const s = await start(['T-13'])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await T13.run(ctx)
    expect(r.status).toBe('fail')
    await s.close()
  })
})
