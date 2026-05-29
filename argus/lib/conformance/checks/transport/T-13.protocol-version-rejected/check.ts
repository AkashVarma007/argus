import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'T-13',
  category: 'transport',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['2025-11-25', 'DRAFT-2026-v1'],
  deterministic: true,
  title: 'Server rejects bogus MCP-Protocol-Version',
  probe: 'POST a ping with MCP-Protocol-Version: 9999-99-99',
  criterion: 'Server returns HTTP 400 Bad Request',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: '§ Headers',
    quote: 'Servers MUST reject requests with unrecognized MCP-Protocol-Version with HTTP 400.',
  },
  async run(ctx) {
    const start = performance.now()
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'MCP-Protocol-Version': '9999-99-99',
    }
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' })
    const res = await ctx.rawHttp.fetch({ method: 'POST', headers, body })
    const durationMs = performance.now() - start
    const evidence = {
      response: { status: res.status, headers: res.headers, body: await res.text() },
      expected: 400,
      actual: res.status,
    }
    if (res.status === 400) {
      return { checkId: 'T-13', status: 'pass', durationMs, evidence }
    }
    return {
      checkId: 'T-13',
      status: 'fail',
      message: `Expected 400 for bogus protocol version, got ${res.status}.`,
      durationMs,
      evidence,
    }
  },
}

export default check
