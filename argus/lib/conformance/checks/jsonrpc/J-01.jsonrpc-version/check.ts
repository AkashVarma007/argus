import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'J-01',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  title: 'Every response contains "jsonrpc": "2.0"',
  probe: 'POST an initialize request and inspect the response envelope',
  criterion: 'Response JSON has a top-level "jsonrpc" field equal to "2.0"',
  specRef: {
    url: 'https://www.jsonrpc.org/specification#response_object',
    section: '§ 5 Response object',
    quote: 'The jsonrpc member MUST be exactly "2.0".',
  },
  async run(ctx) {
    const tStart = performance.now()
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: ctx.spec,
        capabilities: {},
        clientInfo: { name: 'argus', version: '0' },
      },
    })
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'MCP-Protocol-Version': ctx.spec,
    }
    const res = await ctx.rawHttp.fetch({ method: 'POST', headers, body })
    const raw = await res.json<{ jsonrpc?: string }>()
    const durationMs = performance.now() - tStart
    const evidence = {
      request: { method: 'POST', url: ctx.rawHttp.url, headers, body: JSON.parse(body) },
      response: { status: res.status, headers: res.headers, body: raw },
      expected: { jsonrpc: '2.0' },
      actual: { jsonrpc: raw.jsonrpc },
    }
    if (raw.jsonrpc === '2.0') {
      return { checkId: 'J-01', status: 'pass', durationMs, evidence }
    }
    return {
      checkId: 'J-01',
      status: 'fail',
      message: `Expected jsonrpc="2.0", got ${JSON.stringify(raw.jsonrpc)}.`,
      durationMs,
      evidence,
    }
  },
}

export default check
