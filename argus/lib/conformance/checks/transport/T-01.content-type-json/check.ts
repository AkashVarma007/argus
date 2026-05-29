import type { Check } from '@/lib/conformance/types'
import { renderCurl } from '@/lib/conformance/helpers/curl'

const check: Check = {
  id: 'T-01',
  category: 'transport',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['2025-11-25', 'DRAFT-2026-v1'],
  deterministic: true,
  title: 'Server accepts application/json POST bodies',
  probe: 'POST a JSON-RPC ping with Content-Type: application/json',
  criterion: 'Server returns 200/202/SSE — never 415',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: '§ Streamable HTTP',
    quote: 'The server MUST accept POST requests with Content-Type: application/json.',
  },
  async run(ctx) {
    const start = performance.now()
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' })
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'MCP-Protocol-Version': ctx.spec,
    }
    const res = await ctx.rawHttp.fetch({ method: 'POST', headers, body })
    const durationMs = performance.now() - start
    const evidence = {
      request: { method: 'POST', url: ctx.rawHttp.url, headers, body: JSON.parse(body) },
      response: { status: res.status, headers: res.headers, body: await res.text() },
      expected: 'status in {200, 202}',
      actual: res.status,
      curlCommand: renderCurl({ method: 'POST', url: ctx.rawHttp.url, headers, body }),
    }
    if (res.status === 415) {
      return {
        checkId: 'T-01',
        status: 'fail',
        message: 'Server returned 415 to application/json; spec REQUIRES it accept application/json.',
        durationMs,
        evidence,
      }
    }
    if (res.status === 200 || res.status === 202) {
      return { checkId: 'T-01', status: 'pass', durationMs, evidence }
    }
    return {
      checkId: 'T-01',
      status: 'fail',
      message: `Expected 200/202, got ${res.status}.`,
      durationMs,
      evidence,
    }
  },
}

export default check
