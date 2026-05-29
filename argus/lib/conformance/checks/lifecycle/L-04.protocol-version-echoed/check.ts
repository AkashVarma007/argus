import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'L-04',
  category: 'lifecycle',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  title: 'Server echoes requested protocolVersion when supported',
  probe: 'initialize({ protocolVersion: ctx.spec }); inspect echoed value.',
  criterion: 'Server MUST echo the requested protocolVersion when it can serve that version.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle',
    section: 'Version negotiation',
    quote: 'If the server supports the requested version, it MUST respond with the same version.',
  },
  async run(ctx) {
    const tStart = performance.now()
    const init = await ctx.client.initialize(ctx.spec)
    const durationMs = performance.now() - tStart
    if (init.protocolVersion === ctx.spec) {
      return {
        checkId: 'L-04',
        status: 'pass',
        durationMs,
        evidence: {
          response: { body: init },
          expected: ctx.spec,
          actual: init.protocolVersion,
        },
      }
    }
    return {
      checkId: 'L-04',
      status: 'fail',
      durationMs,
      message: `Expected protocolVersion "${ctx.spec}", got "${init.protocolVersion}".`,
      evidence: {
        response: { body: init },
        expected: ctx.spec,
        actual: init.protocolVersion,
      },
    }
  },
}

export default check
