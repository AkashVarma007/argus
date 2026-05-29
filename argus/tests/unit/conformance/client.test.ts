import { describe, it, expect, vi } from 'vitest'
import { createMcpClient } from '@/lib/conformance/client'
import type { Transport } from '@/lib/conformance/transport/types'
import type { JsonRpcRequest, JsonRpcNotification, JsonRpcResponse } from '@/lib/conformance/helpers/jsonrpc'

function fakeTransport(responder: (r: JsonRpcRequest) => JsonRpcResponse): Transport & { notifs: JsonRpcNotification[] } {
  const notifs: JsonRpcNotification[] = []
  return {
    kind: 'http',
    notifs,
    async send(r: JsonRpcRequest) { return responder(r) },
    async notify(n: JsonRpcNotification) { notifs.push(n) },
    async close() { /* */ },
  } as unknown as Transport & { notifs: JsonRpcNotification[] }
}

describe('McpClient', () => {
  it('initialize sends declared capabilities and stores serverInfo', async () => {
    const transport = fakeTransport((req) => {
      expect(req.method).toBe('initialize')
      const params = req.params as { protocolVersion: string; capabilities: unknown; clientInfo: { name: string } }
      expect(params.protocolVersion).toBe('2025-11-25')
      expect(params.clientInfo.name).toBe('argus')
      return {
        jsonrpc: '2.0',
        id: req.id,
        result: {
          protocolVersion: '2025-11-25',
          capabilities: { tools: {} },
          serverInfo: { name: 'demo', version: '1.0.0' },
        },
      }
    })
    const client = createMcpClient(transport, '2025-11-25')
    const result = await client.initialize()
    expect(result.serverInfo.name).toBe('demo')
    expect(client.capabilities.tools).toBeDefined()
    expect(client.serverInfo?.name).toBe('demo')
  })

  it('emits notifications/initialized after a successful initialize', async () => {
    const t = fakeTransport((req) => ({
      jsonrpc: '2.0',
      id: req.id,
      result: {
        protocolVersion: '2025-11-25',
        capabilities: {},
        serverInfo: { name: 'x', version: '1.0' },
      },
    }))
    const client = createMcpClient(t, '2025-11-25')
    await client.initialize()
    await client.notifyInitialized()
    expect(t.notifs.some((n) => n.method === 'notifications/initialized')).toBe(true)
  })

  it('call() wraps a method and returns result on success', async () => {
    const t = fakeTransport((req) => {
      if (req.method === 'initialize') {
        return {
          jsonrpc: '2.0', id: req.id,
          result: { protocolVersion: '2025-11-25', capabilities: {}, serverInfo: { name: 'x', version: '1' } },
        }
      }
      return { jsonrpc: '2.0', id: req.id, result: { tools: [{ name: 'a' }] } }
    })
    const client = createMcpClient(t, '2025-11-25')
    await client.initialize()
    const r = await client.call('tools/list', {})
    expect(r.result).toEqual({ tools: [{ name: 'a' }] })
  })

  it('call() returns the error envelope without throwing', async () => {
    const t = fakeTransport((req) => {
      if (req.method === 'initialize') {
        return {
          jsonrpc: '2.0', id: req.id,
          result: { protocolVersion: '2025-11-25', capabilities: {}, serverInfo: { name: 'x', version: '1' } },
        }
      }
      return { jsonrpc: '2.0', id: req.id, error: { code: -32601, message: 'no such method' } }
    })
    const client = createMcpClient(t, '2025-11-25')
    await client.initialize()
    const r = await client.call('missing/method', {})
    expect(r.error?.code).toBe(-32601)
  })

  it('declares sampling/elicitation/roots capabilities by default', async () => {
    const captured = vi.fn<(r: JsonRpcRequest) => JsonRpcResponse>((req) => ({
      jsonrpc: '2.0', id: req.id,
      result: { protocolVersion: '2025-11-25', capabilities: {}, serverInfo: { name: 'x', version: '1' } },
    }))
    const t = fakeTransport(captured)
    const client = createMcpClient(t, '2025-11-25')
    await client.initialize()
    const params = captured.mock.calls[0][0].params as { capabilities: { sampling?: unknown; elicitation?: unknown; roots?: unknown } }
    expect(params.capabilities.sampling).toBeDefined()
    expect(params.capabilities.elicitation).toBeDefined()
    expect(params.capabilities.roots).toBeDefined()
  })
})
