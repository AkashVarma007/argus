import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { createApp } from '../src/server'

const ORIG_FETCH = globalThis.fetch

beforeEach(() => {
  globalThis.fetch = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } }),
  ) as unknown as typeof fetch
})
afterEach(() => { globalThis.fetch = ORIG_FETCH })

describe('argus-proxy server', () => {
  it('GET /health returns 200 ok', async () => {
    const app = createApp({ allowPrivate: false })
    const res = await request(app).get('/health')
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
  })

  it('POST /proxy forwards request and returns the upstream body', async () => {
    const app = createApp({ allowPrivate: false })
    const res = await request(app)
      .post('/proxy')
      .send({ url: 'https://api.example.com/mcp', init: { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' } })
    expect(res.status).toBe(200)
    expect(res.body).toEqual({ ok: true })
    expect(res.headers['access-control-allow-origin']).toBe('*')
    expect(globalThis.fetch).toHaveBeenCalledWith('https://api.example.com/mcp', expect.objectContaining({ method: 'POST' }))
  })

  it('rejects disallowed targets with 400', async () => {
    const app = createApp({ allowPrivate: false })
    const res = await request(app)
      .post('/proxy')
      .send({ url: 'http://localhost:3845/mcp', init: { method: 'GET', headers: {} } })
    expect(res.status).toBe(400)
    expect(res.body.error).toMatch(/not allowed/i)
  })

  it('permits private targets when configured', async () => {
    const app = createApp({ allowPrivate: true })
    const res = await request(app)
      .post('/proxy')
      .send({ url: 'http://localhost:3845/mcp', init: { method: 'GET', headers: {} } })
    expect(res.status).toBe(200)
  })

  it('400 when url is missing', async () => {
    const app = createApp({ allowPrivate: true })
    const res = await request(app).post('/proxy').send({ init: { method: 'GET', headers: {} } })
    expect(res.status).toBe(400)
  })
})
