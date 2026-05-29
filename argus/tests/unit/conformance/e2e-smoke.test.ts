import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createTortureApp } from '../../../../torture-server/src/index'
import { listChecks } from '@/lib/conformance/registry'
import { runScan } from '@/lib/conformance/runner'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { createMcpClient } from '@/lib/conformance/client'
import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'

let server: Server, port: number

beforeAll(async () => {
  const app = createTortureApp({ violations: new Set() })
  await new Promise<void>((r) => { server = app.listen(0, '127.0.0.1', () => r()) })
  port = (server.address() as AddressInfo).port
})
afterAll(() => new Promise<void>((r) => server.close(() => r())))

describe('e2e smoke', () => {
  it('clean torture-server scores A or better', async () => {
    const url = `http://127.0.0.1:${port}/mcp`
    const rawHttp = createRawHttpClient({ url })
    const transport = createHttpTransport({ kind: 'http', url, protocolVersion: 'DRAFT-2026-v1' })
    const client = createMcpClient(transport, 'DRAFT-2026-v1', url)
    const init = await client.initialize()
    const ctx = {
      client, rawHttp, transport,
      spec: 'DRAFT-2026-v1' as const,
      serverInfo: init,
      capabilities: init.capabilities ?? {},
      log: () => {},
      authMode: 'none' as const,
    }
    const { grade, results } = await runScan(listChecks(), ctx, {})
    const fails = results.filter((r) => r.status === 'fail')
    if (fails.length > 0) {
      console.error('Falsely failing checks:', fails.map(f => ({ id: f.checkId, message: f.message })))
    }
    expect(fails).toEqual([])
    expect(['A+', 'A']).toContain(grade)
  }, 30_000)
})
