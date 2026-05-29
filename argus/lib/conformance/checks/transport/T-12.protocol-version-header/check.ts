import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'T-12',
  category: 'transport',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['2025-11-25'],
  deterministic: true,
  title: 'Server requires MCP-Protocol-Version on post-initialize requests',
  probe: 'POST a ping without the MCP-Protocol-Version header',
  criterion: 'Server returns HTTP 400 Bad Request',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: '§ Headers',
    quote: 'After initialization, clients MUST include the MCP-Protocol-Version header on all requests. Servers MUST reject requests missing this header with HTTP 400.',
  },
  async run(ctx) {
    const start = performance.now()
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
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
      return { checkId: 'T-12', status: 'pass', durationMs, evidence }
    }
    return {
      checkId: 'T-12',
      status: 'fail',
      message: `Expected 400 for missing MCP-Protocol-Version, got ${res.status}.`,
      durationMs,
      evidence,
    }
  },
}

export default check
