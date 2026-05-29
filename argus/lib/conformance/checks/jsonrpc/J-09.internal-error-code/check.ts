import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'J-09',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  title: 'Internal server error returns error code -32603',
  probe: 'Trigger a server-side internal error and check the error code',
  criterion: 'Error code is exactly -32603 (Internal error)',
  specRef: {
    url: 'https://www.jsonrpc.org/specification#error_object',
    section: '§ 5.1 Error object',
    quote: '-32603 Internal error: Internal JSON-RPC error.',
  },
  async run(ctx) {
    const tStart = performance.now()
    const { error, raw } = await ctx.client.call('__torture/internal-error', {})
    const durationMs = performance.now() - tStart
    const evidence = {
      response: { body: raw },
      expected: -32603,
      actual: error?.code,
    }
    if (error?.code === -32603) {
      return { checkId: 'J-09', status: 'pass', durationMs, evidence }
    }
    if (error?.code === -32601) {
      return {
        checkId: 'J-09',
        status: 'skip',
        message: 'target lacks internal-error trigger',
        durationMs,
        evidence,
      }
    }
    return {
      checkId: 'J-09',
      status: 'fail',
      message: `Expected error code -32603, got ${JSON.stringify(error?.code)}.`,
      durationMs,
      evidence,
    }
  },
}

export default check
