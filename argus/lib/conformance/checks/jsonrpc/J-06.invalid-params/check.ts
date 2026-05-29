import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'J-06',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  title: 'Invalid params returns error code -32602',
  probe: 'Call tools/call without required "name" field and check the error code',
  criterion: 'Error code is exactly -32602 (Invalid params)',
  specRef: {
    url: 'https://www.jsonrpc.org/specification#error_object',
    section: '§ 5.1 Error object',
    quote: '-32602 Invalid params: Invalid method parameter(s).',
  },
  async run(ctx) {
    const tStart = performance.now()
    const { error, raw } = await ctx.client.call('tools/call', { arguments: {} })
    const durationMs = performance.now() - tStart
    const evidence = {
      response: { body: raw },
      expected: -32602,
      actual: error?.code,
    }
    if (error?.code === -32602) {
      return { checkId: 'J-06', status: 'pass', durationMs, evidence }
    }
    return {
      checkId: 'J-06',
      status: 'fail',
      message: `Expected error code -32602, got ${JSON.stringify(error?.code)}.`,
      durationMs,
      evidence,
    }
  },
}

export default check
