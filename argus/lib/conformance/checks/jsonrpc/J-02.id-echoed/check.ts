import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'J-02',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  title: 'Response id matches request id',
  probe: 'POST a JSON-RPC request with a known string id and verify the response echoes it',
  criterion: 'Response "id" field equals the request "id" field',
  specRef: {
    url: 'https://www.jsonrpc.org/specification#response_object',
    section: '§ 5 Response object',
    quote: 'The id member MUST be the same as the value of the id member in the Request Object.',
  },
  async run(ctx) {
    const tStart = performance.now()
    const requestId = 'abc-xyz'
    const body = JSON.stringify({
      jsonrpc: '2.0',
      id: requestId,
      method: 'ping',
      params: {},
    })
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'MCP-Protocol-Version': ctx.spec,
    }
    const res = await ctx.rawHttp.fetch({ method: 'POST', headers, body })
    const parsed = await res.json<{ id?: unknown }>()
    const durationMs = performance.now() - tStart
    const evidence = {
      request: { method: 'POST', url: ctx.rawHttp.url, headers, body: JSON.parse(body) },
      response: { status: res.status, headers: res.headers, body: parsed },
      expected: requestId,
      actual: parsed.id,
    }
    if (parsed.id === requestId) {
      return { checkId: 'J-02', status: 'pass', durationMs, evidence }
    }
    return {
      checkId: 'J-02',
      status: 'fail',
      message: `Expected id="${requestId}", got ${JSON.stringify(parsed.id)}.`,
      durationMs,
      evidence,
    }
  },
}

export default check
