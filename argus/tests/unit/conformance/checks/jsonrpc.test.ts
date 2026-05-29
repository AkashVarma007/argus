import { describe, it, expect } from 'vitest'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { createTortureApp } from '../../../../../torture-server/src/index'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createMcpClient } from '@/lib/conformance/client'
import type { CheckContext } from '@/lib/conformance/types'
import J01 from '@/lib/conformance/checks/jsonrpc/J-01.jsonrpc-version/check'
import J02 from '@/lib/conformance/checks/jsonrpc/J-02.id-echoed/check'
import J03 from '@/lib/conformance/checks/jsonrpc/J-03.result-xor-error/check'
import J04 from '@/lib/conformance/checks/jsonrpc/J-04.unknown-method/check'
import J05 from '@/lib/conformance/checks/jsonrpc/J-05.parse-error/check'
import J06 from '@/lib/conformance/checks/jsonrpc/J-06.invalid-params/check'
import J07 from '@/lib/conformance/checks/jsonrpc/J-07.notification-no-response/check'
import J08 from '@/lib/conformance/checks/jsonrpc/J-08.error-shape/check'
import J09 from '@/lib/conformance/checks/jsonrpc/J-09.internal-error-code/check'

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

describe('jsonrpc checks', () => {
  it('J-01 passes when response contains jsonrpc: "2.0"', async () => {
    const s = await start([])
    const r = await J01.run(await makeCtx(s.url))
    expect(r.status).toBe('pass')
    expect(r.evidence).toBeDefined()
    expect((r.evidence as { actual?: { jsonrpc?: string } })?.actual?.jsonrpc).toBe('2.0')
    await s.close()
  })

  it('J-01 fails when jsonrpc field is omitted from response', async () => {
    const s = await start(['J-01'])
    const rawHttp = createRawHttpClient({ url: s.url })
    const ctx = { rawHttp, transport: { kind: 'http' } as never, spec: '2025-11-25' } as unknown as CheckContext
    const r = await J01.run(ctx)
    expect(r.status).toBe('fail')
    await s.close()
  })

  it('J-02 passes when id is echoed back', async () => {
    const s = await start([])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await J02.run(ctx)
    expect(r.status).toBe('pass')
    expect(r.evidence).toBeDefined()
    await s.close()
  })

  it('J-02 fails when id is not echoed back', async () => {
    const s = await start(['J-02'])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), spec: '2025-11-25' } as unknown as CheckContext
    const r = await J02.run(ctx)
    expect(r.status).toBe('fail')
    await s.close()
  })

  it('J-03 passes when response has result XOR error', async () => {
    const s = await start([])
    const r = await J03.run(await makeCtx(s.url))
    expect(r.status).toBe('pass')
    expect(r.evidence).toBeDefined()
    expect((r.evidence as { actual?: { hasResult?: boolean } })?.actual?.hasResult).toBe(true)
    await s.close()
  })

  it('J-04 passes when unknown method returns -32601', async () => {
    const s = await start([])
    const r = await J04.run(await makeCtx(s.url))
    expect(r.status).toBe('pass')
    expect(r.evidence).toBeDefined()
    expect((r.evidence as { actual?: number })?.actual).toBe(-32601)
    await s.close()
  })

  it('J-04 fails when unknown method returns wrong code', async () => {
    const s = await start(['J-04'])
    const r = await J04.run(await makeCtx(s.url))
    expect(r.status).toBe('fail')
    await s.close()
  })

  it('J-05 passes when malformed JSON returns -32700', async () => {
    const s = await start([])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), transport: { kind: 'http' } as never, spec: '2025-11-25' } as unknown as CheckContext
    const r = await J05.run(ctx)
    expect(r.status).toBe('pass')
    expect(r.evidence).toBeDefined()
    await s.close()
  })

  it('J-06 passes when invalid params returns -32602', async () => {
    const s = await start([])
    const r = await J06.run(await makeCtx(s.url))
    expect(r.status).toBe('pass')
    expect(r.evidence).toBeDefined()
    expect((r.evidence as { actual?: number })?.actual).toBe(-32602)
    await s.close()
  })

  it('J-07 passes when notification returns 202 empty', async () => {
    const s = await start([])
    const ctx = { rawHttp: createRawHttpClient({ url: s.url }), transport: { kind: 'http' } as never, spec: '2025-11-25' } as unknown as CheckContext
    const r = await J07.run(ctx)
    expect(r.status).toBe('pass')
    expect(r.evidence).toBeDefined()
    expect((r.evidence as { actual?: { status?: number } })?.actual?.status).toBe(202)
    await s.close()
  })

  it('J-08 passes when error has integer code and string message', async () => {
    const s = await start([])
    const r = await J08.run(await makeCtx(s.url))
    expect(r.status).toBe('pass')
    expect(r.evidence).toBeDefined()
    expect((r.evidence as { actual?: { 'error.codeType'?: string } })?.actual?.['error.codeType']).toBe('number')
    await s.close()
  })

  it('J-09 passes when __torture/internal-error returns -32603', async () => {
    const s = await start([])
    const r = await J09.run(await makeCtx(s.url))
    expect(r.status).toBe('pass')
    expect(r.evidence).toBeDefined()
    expect((r.evidence as { actual?: number })?.actual).toBe(-32603)
    await s.close()
  })

  it('J-09 fails when __torture/internal-error returns wrong code', async () => {
    const s = await start(['J-09'])
    const r = await J09.run(await makeCtx(s.url))
    expect(r.status).toBe('fail')
    expect((r.evidence as { actual?: number })?.actual).toBe(-32602)
    await s.close()
  })
})
