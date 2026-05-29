import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'L-02',
  category: 'lifecycle',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  title: 'serverInfo name and version are strings',
  probe: 'Inspect serverInfo for correct field types.',
  criterion: 'serverInfo.name and serverInfo.version MUST be strings; optional fields typed correctly.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle',
    section: 'Implementation info',
    quote: 'name and version MUST be strings; title, description, websiteUrl SHOULD be strings if present.',
  },
  async run(ctx) {
    const tStart = performance.now()
    const init = await ctx.client.initialize()
    const durationMs = performance.now() - tStart
    const si = (init.serverInfo ?? {}) as Record<string, unknown>
    const errs: string[] = []
    if (typeof si['name'] !== 'string') errs.push(`name is ${typeof si['name']}`)
    if (typeof si['version'] !== 'string') errs.push(`version is ${typeof si['version']}`)
    for (const opt of ['title', 'description', 'websiteUrl']) {
      if (opt in si && typeof si[opt] !== 'string') errs.push(`${opt} is ${typeof si[opt]}`)
    }
    if (errs.length === 0) {
      return {
        checkId: 'L-02',
        status: 'pass',
        durationMs,
        evidence: {
          response: { body: init },
          actual: si,
        },
      }
    }
    return {
      checkId: 'L-02',
      status: 'fail',
      durationMs,
      message: `serverInfo field types invalid: ${errs.join(', ')}.`,
      evidence: {
        response: { body: init },
        expected: 'string fields',
        actual: si,
      },
    }
  },
}

export default check
