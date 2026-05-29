import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'L-06',
  category: 'lifecycle',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  title: 'After notifications/initialized, normal requests succeed',
  probe: 'initialize → send notifications/initialized → call ping → expect success.',
  criterion: 'Subsequent normal requests MUST succeed after the initialized notification.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle',
    section: 'Initialization',
    quote: 'After receiving the initialize response, the client SHOULD send an initialized notification.',
  },
  async run(ctx) {
    const tStart = performance.now()
    await ctx.client.initialize()
    await ctx.client.notify('notifications/initialized', {})
    const { result, error } = await ctx.client.call('ping', {})
    const durationMs = performance.now() - tStart
    if (error) {
      return {
        checkId: 'L-06',
        status: 'fail',
        durationMs,
        message: `ping after initialized failed: ${error.code} ${error.message}`,
        evidence: {
          response: { body: error },
          actual: error,
        },
      }
    }
    return {
      checkId: 'L-06',
      status: 'pass',
      durationMs,
      evidence: {
        response: { body: result },
        actual: result,
      },
    }
  },
}

export default check
