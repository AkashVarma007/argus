import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'T-05',
  category: 'transport',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['2025-11-25', 'DRAFT-2026-v1'],
  deterministic: true,
  title: 'Notification (no id) returns 202 Accepted with empty body',
  probe: 'POST a JSON-RPC notification without an id field',
  criterion: 'Status is 202 and body is empty',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: '§ Streamable HTTP — Notifications',
    quote: 'For notifications, the server MUST respond with HTTP 202 Accepted and an empty body.',
  },
  async run(ctx) {
    const start = performance.now()
    const body = JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' })
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'MCP-Protocol-Version': ctx.spec,
    }
    const res = await ctx.rawHttp.fetch({ method: 'POST', headers, body })
    const text = await res.text()
    const durationMs = performance.now() - start
    const evidence = {
      response: { status: res.status, headers: res.headers, body: text },
      expected: { status: 202, body: '' },
      actual: { status: res.status, body: text },
    }
    if (res.status === 202 && text === '') {
      return { checkId: 'T-05', status: 'pass', durationMs, evidence }
    }
    return {
      checkId: 'T-05',
      status: 'fail',
      message: `Expected 202+empty, got ${res.status}+${text.length}B`,
      durationMs,
      evidence,
    }
  },
}

export default check
