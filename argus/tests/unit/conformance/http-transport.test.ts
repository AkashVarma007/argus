import { describe, it, expect, vi, afterEach } from 'vitest'
import { createHttpTransport } from '@/lib/conformance/transport/http'
import { buildRequest, buildNotification } from '@/lib/conformance/helpers/jsonrpc'

const ORIG_FETCH = globalThis.fetch

afterEach(() => { globalThis.fetch = ORIG_FETCH })

describe('HttpTransport', () => {
  it('POSTs a request with mandatory headers and returns the parsed response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(
      JSON.stringify({ jsonrpc: '2.0', id: 1, result: { ok: true } }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )) as unknown as typeof fetch

    const t = createHttpTransport({
      kind: 'http',
      url: 'http://localhost:3845/mcp',
      protocolVersion: '2025-11-25',
    })
    const res = await t.send(buildRequest('ping', undefined, 1))
    expect(res).toEqual({ jsonrpc: '2.0', id: 1, result: { ok: true } })

    const init = ((globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1] as RequestInit)
    const hdr = init.headers as Record<string, string>
    expect(hdr['Content-Type']).toBe('application/json')
    expect(hdr['Accept']).toBe('application/json, text/event-stream')
    expect(hdr['MCP-Protocol-Version']).toBe('2025-11-25')
  })

  it('parses a single SSE event body as the response', async () => {
    const sse =
      'event: message\n' +
      'data: {"jsonrpc":"2.0","id":2,"result":{"name":"x"}}\n\n'
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(sse, {
      status: 200, headers: { 'content-type': 'text/event-stream' },
    })) as unknown as typeof fetch

    const t = createHttpTransport({
      kind: 'http',
      url: 'http://localhost:3845/mcp',
      protocolVersion: '2025-11-25',
    })
    const res = await t.send(buildRequest('tools/list', {}, 2))
    expect(res).toEqual({ jsonrpc: '2.0', id: 2, result: { name: 'x' } })
  })

  it('notify expects 202 and returns void', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response(null, { status: 202 })) as unknown as typeof fetch
    const t = createHttpTransport({
      kind: 'http',
      url: 'http://localhost:3845/mcp',
      protocolVersion: '2025-11-25',
    })
    await expect(t.notify(buildNotification('notifications/initialized'))).resolves.toBeUndefined()
  })

  it('throws on non-2xx response when sending a request', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(new Response('boom', { status: 500 })) as unknown as typeof fetch
    const t = createHttpTransport({
      kind: 'http',
      url: 'http://localhost:3845/mcp',
      protocolVersion: '2025-11-25',
    })
    await expect(t.send(buildRequest('ping', undefined, 9))).rejects.toThrow(/HTTP 500/)
  })
})
