import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { createTortureApp } from '../src/index'

describe('torture-server smoke', () => {
  it('initialize returns a result envelope', async () => {
    const app = createTortureApp({ violations: new Set() })
    const res = await request(app)
      .post('/mcp')
      .set('content-type', 'application/json')
      .set('mcp-protocol-version', '2025-11-25')
      .send({ jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-11-25', capabilities: {}, clientInfo: { name: 't', version: '1' } } })
    expect(res.status).toBe(200)
    expect(res.body.result.serverInfo.name).toBe('torture')
    expect(res.body.result.capabilities.tools).toBeDefined()
  })

  it('with violation T-07 enabled, foreign Origin still returns 200', async () => {
    const app = createTortureApp({ violations: new Set(['T-07']) })
    const res = await request(app)
      .post('/mcp')
      .set('content-type', 'application/json')
      .set('mcp-protocol-version', '2025-11-25')
      .set('origin', 'https://evil.example.com')
      .send({ jsonrpc: '2.0', id: 1, method: 'ping' })
    expect(res.status).toBe(200)
  })

  it('without violation T-07, foreign Origin returns 403', async () => {
    const app = createTortureApp({ violations: new Set() })
    const res = await request(app)
      .post('/mcp')
      .set('content-type', 'application/json')
      .set('mcp-protocol-version', '2025-11-25')
      .set('origin', 'https://evil.example.com')
      .send({ jsonrpc: '2.0', id: 1, method: 'ping' })
    expect(res.status).toBe(403)
  })
})
