import { describe, it, expect } from 'vitest'
import { isAllowedTarget } from '../src/ssrf'

describe('SSRF guard', () => {
  it('allows public hostnames by default', () => {
    expect(isAllowedTarget('https://api.example.com/mcp', { allowPrivate: false })).toBe(true)
  })

  it('blocks localhost when allowPrivate is false', () => {
    expect(isAllowedTarget('http://localhost:3845/mcp', { allowPrivate: false })).toBe(false)
    expect(isAllowedTarget('http://127.0.0.1:3845/mcp', { allowPrivate: false })).toBe(false)
  })

  it('blocks RFC1918 IPv4 ranges when allowPrivate is false', () => {
    expect(isAllowedTarget('http://10.0.0.1/x', { allowPrivate: false })).toBe(false)
    expect(isAllowedTarget('http://192.168.1.1/x', { allowPrivate: false })).toBe(false)
    expect(isAllowedTarget('http://172.16.0.1/x', { allowPrivate: false })).toBe(false)
  })

  it('blocks link-local IPv4 169.254.0.0/16', () => {
    expect(isAllowedTarget('http://169.254.169.254/latest/meta-data/', { allowPrivate: false })).toBe(false)
  })

  it('blocks loopback + link-local IPv6', () => {
    expect(isAllowedTarget('http://[::1]/x', { allowPrivate: false })).toBe(false)
    expect(isAllowedTarget('http://[fe80::1]/x', { allowPrivate: false })).toBe(false)
    expect(isAllowedTarget('http://[fc00::1]/x', { allowPrivate: false })).toBe(false)
  })

  it('blocks IPv4-mapped IPv6 (::ffff:) when allowPrivate is false', () => {
    expect(isAllowedTarget('http://[::ffff:127.0.0.1]/', { allowPrivate: false })).toBe(false)
    expect(isAllowedTarget('http://[::ffff:7f00:1]/', { allowPrivate: false })).toBe(false)
  })

  it('allows private targets when allowPrivate is true', () => {
    expect(isAllowedTarget('http://localhost:3845/mcp', { allowPrivate: true })).toBe(true)
    expect(isAllowedTarget('http://192.168.1.10/x', { allowPrivate: true })).toBe(true)
  })

  it('rejects non-http(s) schemes always', () => {
    expect(isAllowedTarget('file:///etc/passwd', { allowPrivate: true })).toBe(false)
    expect(isAllowedTarget('ftp://example.com/', { allowPrivate: true })).toBe(false)
    expect(isAllowedTarget('not-a-url', { allowPrivate: true })).toBe(false)
  })
})
