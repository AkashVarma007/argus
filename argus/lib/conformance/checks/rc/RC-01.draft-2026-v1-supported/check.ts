import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'RC-01',
  category: 'rc',
  severity: 'warning',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1'],
  title: 'Server initializes with protocolVersion DRAFT-2026-v1',
  probe: 'initialize({ protocolVersion: "DRAFT-2026-v1" }); inspect echoed version.',
  criterion: 'Echoed protocolVersion MUST be `DRAFT-2026-v1`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/draft-2026-v1',
    section: 'Draft 2026 v1',
    quote: 'protocolVersion = "DRAFT-2026-v1"',
  },
  deterministic: true,
  async run(ctx) {
    const tStart = performance.now()
    let init: Awaited<ReturnType<typeof ctx.client.initialize>>
    try {
      init = await ctx.client.initialize()
    } catch (e) {
      return {
        checkId: 'RC-01',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `initialize threw: ${(e as Error).message}`,
      }
    }
    const durationMs = performance.now() - tStart
    if (init.protocolVersion === 'DRAFT-2026-v1') {
      return {
        checkId: 'RC-01',
        status: 'pass',
        durationMs,
        evidence: { response: { body: init } },
      }
    }
    return {
      checkId: 'RC-01',
      status: 'fail',
      durationMs,
      message: `Expected DRAFT-2026-v1, got ${init.protocolVersion}.`,
      evidence: { expected: 'DRAFT-2026-v1', actual: init.protocolVersion },
    }
  },
}

export default check
