import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'J-05',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  title: 'Malformed JSON body returns error code -32700',
  probe: 'POST a truncated/invalid JSON body and check the error code',
  criterion: 'Error code is exactly -32700 (Parse error)',
  specRef: {
    url: 'https://www.jsonrpc.org/specification#error_object',
    section: '§ 5.1 Error object',
    quote: '-32700 Parse error: Invalid JSON was received by the server.',
  },
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return {
        checkId: 'J-05',
        status: 'skip',
        message: 'Parse error test requires HTTP transport.',
        durationMs: 0,
      }
    }
    const tStart = performance.now()
    const malformedBody = '{"jsonrpc":"2.0","id":1,"method":'
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'MCP-Protocol-Version': ctx.spec,
    }
    const res = await ctx.rawHttp.fetch({ method: 'POST', headers, body: malformedBody })
    let body: { error?: { code?: number } } | undefined
    try {
      body = await res.json<{ error?: { code?: number } }>()
    } catch {
      body = undefined
    }
    const durationMs = performance.now() - tStart
    const evidence = {
      request: { method: 'POST', url: ctx.rawHttp.url, headers, body: malformedBody },
      response: { status: res.status, headers: res.headers, body },
      expected: -32700,
      actual: body?.error?.code,
    }
    if (body?.error?.code === -32700) {
      return { checkId: 'J-05', status: 'pass', durationMs, evidence }
    }
    return {
      checkId: 'J-05',
      status: 'fail',
      message: `Expected error code -32700, got ${JSON.stringify(body?.error?.code)}.`,
      durationMs,
      evidence,
    }
  },
}

export default check
