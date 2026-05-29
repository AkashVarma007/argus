import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'L-01',
  category: 'lifecycle',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  title: 'initialize result has protocolVersion, capabilities, serverInfo',
  probe: 'Call initialize; inspect result fields.',
  criterion: 'Result MUST contain `protocolVersion`, `capabilities`, `serverInfo`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle',
    section: 'Initialization',
    quote: 'The server MUST respond with its information including its name, version, and capabilities.',
  },
  async run(ctx) {
    const tStart = performance.now()
    const init = await ctx.client.initialize()
    const durationMs = performance.now() - tStart
    const r = init as unknown as Record<string, unknown>
    const missing = ['protocolVersion', 'capabilities', 'serverInfo'].filter((k) => !(k in r))
    if (missing.length === 0) {
      return {
        checkId: 'L-01',
        status: 'pass',
        durationMs,
        evidence: {
          response: { body: r },
          actual: Object.keys(r),
        },
      }
    }
    return {
      checkId: 'L-01',
      status: 'fail',
      durationMs,
      message: `initialize result missing required fields: ${missing.join(', ')}.`,
      evidence: {
        response: { body: r },
        expected: 'protocolVersion + capabilities + serverInfo',
        actual: Object.keys(r),
      },
    }
  },
}

export default check
