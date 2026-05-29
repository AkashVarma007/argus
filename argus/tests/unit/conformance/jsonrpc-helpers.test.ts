import { describe, it, expect } from 'vitest'
import {
  buildRequest,
  buildNotification,
  isJsonRpcResponse,
  isJsonRpcError,
  isJsonRpcSuccess,
  nextId,
  hasErrorCode,
} from '@/lib/conformance/helpers/jsonrpc'

describe('jsonrpc helpers', () => {
  it('buildRequest wraps method/params with id + jsonrpc 2.0', () => {
    const req = buildRequest('tools/list', { cursor: 'abc' }, 17)
    expect(req).toEqual({
      jsonrpc: '2.0',
      id: 17,
      method: 'tools/list',
      params: { cursor: 'abc' },
    })
  })

  it('buildRequest omits params when undefined', () => {
    const req = buildRequest('ping', undefined, 1)
    expect(req).toEqual({ jsonrpc: '2.0', id: 1, method: 'ping' })
  })

  it('buildNotification has no id field', () => {
    const n = buildNotification('notifications/initialized')
    expect(n).toEqual({ jsonrpc: '2.0', method: 'notifications/initialized' })
    expect('id' in n).toBe(false)
  })

  it('nextId is monotonic increasing', () => {
    const a = nextId()
    const b = nextId()
    expect(b).toBeGreaterThan(a)
  })

  it('isJsonRpcResponse rejects non-objects', () => {
    expect(isJsonRpcResponse(null)).toBe(false)
    expect(isJsonRpcResponse('x')).toBe(false)
    expect(isJsonRpcResponse({ jsonrpc: '2.0', id: 1, result: {} })).toBe(true)
  })

  it('isJsonRpcError detects error envelope', () => {
    expect(isJsonRpcError({ jsonrpc: '2.0', id: 1, error: { code: -32601, message: 'x' } })).toBe(true)
    expect(isJsonRpcError({ jsonrpc: '2.0', id: 1, result: {} })).toBe(false)
  })

  it('isJsonRpcSuccess detects success envelope', () => {
    expect(isJsonRpcSuccess({ jsonrpc: '2.0', id: 1, result: { ok: 1 } })).toBe(true)
    expect(isJsonRpcSuccess({ jsonrpc: '2.0', id: 1, error: { code: 1, message: 'x' } })).toBe(false)
  })

  it('hasErrorCode matches an exact code', () => {
    const e = { jsonrpc: '2.0', id: 1, error: { code: -32601, message: 'x' } }
    expect(hasErrorCode(e, -32601)).toBe(true)
    expect(hasErrorCode(e, -32602)).toBe(false)
    expect(hasErrorCode({ jsonrpc: '2.0', id: 1, result: {} }, -32601)).toBe(false)
  })
})
