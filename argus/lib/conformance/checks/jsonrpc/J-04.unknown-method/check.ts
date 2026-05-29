import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'J-04',
  category: 'jsonrpc',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  title: 'Unknown method returns error code -32601',
  probe: 'Call a nonexistent method and check the error code',
  criterion: 'Error code is exactly -32601 (Method not found)',
  specRef: {
    url: 'https://www.jsonrpc.org/specification#error_object',
    section: '§ 5.1 Error object',
    quote: '-32601 Method not found: The method does not exist / is not available.',
  },
  async run(ctx) {
    const tStart = performance.now()
    const { error, raw } = await ctx.client.call('nonexistent/method', {})
    const durationMs = performance.now() - tStart
    const evidence = {
      response: { body: raw },
      expected: -32601,
      actual: error?.code,
    }
    if (error?.code === -32601) {
      return { checkId: 'J-04', status: 'pass', durationMs, evidence }
    }
    return {
      checkId: 'J-04',
      status: 'fail',
      message: `Expected error code -32601, got ${JSON.stringify(error?.code)}.`,
      durationMs,
      evidence,
    }
  },
}

export default check
