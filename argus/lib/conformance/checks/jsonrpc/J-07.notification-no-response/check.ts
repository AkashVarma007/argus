import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'J-07',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  title: 'Notification receives 202 with empty body',
  probe: 'POST a JSON-RPC notification (no id) and verify 202 + empty body',
  criterion: 'Status is 202 and body is empty',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: '§ Streamable HTTP — Notifications',
    quote: 'For notifications, the server MUST respond with HTTP 202 Accepted and an empty body.',
  },
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return {
        checkId: 'J-07',
        status: 'skip',
        message: 'Notification response test requires HTTP transport.',
        durationMs: 0,
      }
    }
    const tStart = performance.now()
    const body = JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/cancelled',
      params: { requestId: 'x' },
    })
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'MCP-Protocol-Version': ctx.spec,
    }
    const res = await ctx.rawHttp.fetch({ method: 'POST', headers, body })
    const text = await res.text()
    const durationMs = performance.now() - tStart
    const evidence = {
      request: { method: 'POST', url: ctx.rawHttp.url, headers, body: JSON.parse(body) },
      response: { status: res.status, headers: res.headers, body: text },
      expected: { status: 202, body: '' },
      actual: { status: res.status, body: text },
    }
    if (res.status === 202 && text.trim() === '') {
      return { checkId: 'J-07', status: 'pass', durationMs, evidence }
    }
    return {
      checkId: 'J-07',
      status: 'fail',
      message: `Expected 202+empty body, got ${res.status}+${text.length}B.`,
      durationMs,
      evidence,
    }
  },
}

export default check
