import { describe, it, expect } from 'vitest'
import { normalizeHeaders, headerEquals, headerMatches } from '@/lib/conformance/helpers/headers'
import { renderCurl } from '@/lib/conformance/helpers/curl'

describe('header helpers', () => {
  it('normalizeHeaders lowercases keys, trims values', () => {
    const h = normalizeHeaders({ 'Content-Type': '  application/json ', 'X-Foo': 'bar' })
    expect(h).toEqual({ 'content-type': 'application/json', 'x-foo': 'bar' })
  })

  it('headerEquals is case-insensitive on the key', () => {
    expect(headerEquals({ 'Content-Type': 'application/json' }, 'content-type', 'application/json')).toBe(true)
  })

  it('headerMatches checks a regex against the value', () => {
    const ok = headerMatches({ 'www-authenticate': 'Bearer realm="x", resource_metadata="https://y/.well-known/oauth-protected-resource"' }, 'WWW-Authenticate', /resource_metadata="https:\/\/[^"]+"/)
    expect(ok).toBe(true)
  })
})

describe('curl helper', () => {
  it('renderCurl prints multi-line curl with method, headers, body', () => {
    const c = renderCurl({
      method: 'POST',
      url: 'http://localhost:3845/mcp',
      headers: { 'content-type': 'application/json' },
      body: { jsonrpc: '2.0', id: 1, method: 'ping' },
    })
    expect(c).toContain("curl -X POST 'http://localhost:3845/mcp'")
    expect(c).toContain("-H 'content-type: application/json'")
    expect(c).toContain("-d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"ping\"}'")
  })

  it('renderCurl omits -d for GET', () => {
    const c = renderCurl({ method: 'GET', url: 'http://localhost:3845/mcp', headers: {} })
    expect(c).not.toContain(' -d ')
  })
})
