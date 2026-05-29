import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'J-03',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  title: 'Response contains result XOR error, never both or neither',
  probe: 'Call ping and verify the response envelope has exactly one of result or error',
  criterion: 'Exactly one of "result" or "error" is present in the response',
  specRef: {
    url: 'https://www.jsonrpc.org/specification#response_object',
    section: '§ 5 Response object',
    quote: 'Either the result member or the error member MUST be included, but both members MUST NOT be included.',
  },
  async run(ctx) {
    const tStart = performance.now()
    const { raw } = await ctx.client.call('ping', {})
    const durationMs = performance.now() - tStart
    const hasResult = 'result' in raw
    const hasError = 'error' in raw
    const evidence = {
      response: { body: raw },
      expected: 'exactly one of result or error',
      actual: { hasResult, hasError },
    }
    if (hasResult !== hasError) {
      return { checkId: 'J-03', status: 'pass', durationMs, evidence }
    }
    return {
      checkId: 'J-03',
      status: 'fail',
      message: hasResult && hasError
        ? 'Response contains both "result" and "error".'
        : 'Response contains neither "result" nor "error".',
      durationMs,
      evidence,
    }
  },
}

export default check
