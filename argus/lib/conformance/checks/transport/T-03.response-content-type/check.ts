import type { Check } from '@/lib/conformance/types'
import { renderCurl } from '@/lib/conformance/helpers/curl'

const check: Check = {
  id: 'T-03',
  category: 'transport',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['2025-11-25', 'DRAFT-2026-v1'],
  deterministic: true,
  title: 'Response Content-Type is application/json or text/event-stream',
  probe: 'POST a JSON-RPC ping; inspect response Content-Type',
  criterion: 'Content-Type is exactly application/json OR text/event-stream',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: '§ Streamable HTTP',
    quote: 'Response Content-Type MUST be one of application/json or text/event-stream.',
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
    const ct = (res.headers['content-type'] ?? '').split(';')[0].trim().toLowerCase()
    const durationMs = performance.now() - start
    const evidence = {
      response: { status: res.status, headers: res.headers, body: await res.text() },
      expected: 'application/json or text/event-stream',
      actual: ct,
      curlCommand: renderCurl({ method: 'POST', url: ctx.rawHttp.url, headers, body }),
    }
    if (ct === 'application/json' || ct === 'text/event-stream') {
      return { checkId: 'T-03', status: 'pass', durationMs, evidence }
    }
    return {
      checkId: 'T-03',
      status: 'fail',
      message: `Unexpected Content-Type: ${ct}`,
      durationMs,
      evidence,
    }
  },
}

export default check
