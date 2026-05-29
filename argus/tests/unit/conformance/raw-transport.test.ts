import { describe, it, expect, vi, afterEach } from 'vitest'
import { createRawHttpClient } from '@/lib/conformance/transport/raw'

const ORIG_FETCH = globalThis.fetch

afterEach(() => { globalThis.fetch = ORIG_FETCH })

describe('RawHttpClient', () => {
  it('forwards method, headers, body to fetch', async () => {
    const spy = vi.fn().mockResolvedValue(new Response('ok', { status: 200, headers: { 'content-type': 'text/plain' } }))
    globalThis.fetch = spy as unknown as typeof fetch
    const client = createRawHttpClient({ url: 'http://localhost:3845/mcp' })
    const res = await client.fetch({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{}',
    })
    expect(spy).toHaveBeenCalledWith('http://localhost:3845/mcp', expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({ 'content-type': 'application/json' }),
      body: '{}',
    }))
    expect(res.status).toBe(200)
    expect(res.headers['content-type']).toBe('text/plain')
    expect(await res.text()).toBe('ok')
  })

  it('routes through the proxy URL when configured', async () => {
    const spy = vi.fn().mockResolvedValue(new Response('{}', { status: 200, headers: {} }))
    globalThis.fetch = spy as unknown as typeof fetch
    const client = createRawHttpClient({
      url: 'http://localhost:3845/mcp',
      proxyUrl: 'http://127.0.0.1:7878/proxy',
    })
    await client.fetch({ method: 'GET', headers: {} })
    expect(spy).toHaveBeenCalledWith('http://127.0.0.1:7878/proxy', expect.objectContaining({
      method: 'POST',
    }))
    const init = (spy.mock.calls[0][1] as RequestInit)
    expect(JSON.parse(init.body as string)).toEqual({
      url: 'http://localhost:3845/mcp',
      init: { method: 'GET', headers: {} },
    })
  })

  it('returns parsed headers as a plain record', async () => {
    const spy = vi.fn().mockResolvedValue(new Response('ok', { status: 201, headers: { 'x-a': '1', 'x-b': '2' } }))
    globalThis.fetch = spy as unknown as typeof fetch
    const client = createRawHttpClient({ url: 'http://localhost:3845/mcp' })
    const res = await client.fetch({ method: 'GET', headers: {} })
    expect(res.headers['x-a']).toBe('1')
    expect(res.headers['x-b']).toBe('2')
  })
})
