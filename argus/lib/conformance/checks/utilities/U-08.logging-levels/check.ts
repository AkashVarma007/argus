import type { Check } from '@/lib/conformance/types'

// RFC 5424 log levels that MCP's logging/setLevel must accept.
const LEVELS = ['debug', 'info', 'notice', 'warning', 'error', 'critical', 'alert', 'emergency'] as const

const check: Check = {
  id: 'U-08',
  category: 'utilities',
  severity: 'warning',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  requires: ['logging'],
  title: 'logging/setLevel accepts all RFC 5424 log levels',
  probe: 'Call logging/setLevel with each of the 8 RFC 5424 levels; expect non-error result for every level.',
  criterion: 'Servers that declare logging MUST accept all eight RFC 5424 levels for logging/setLevel.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/utilities/logging',
    section: 'Log levels',
    quote: 'The level field MUST be one of the following (in increasing order of severity): debug, info, notice, warning, error, critical, alert, emergency.',
  },
  deterministic: true,
  async run(ctx) {
    if (!ctx.capabilities?.logging) {
      return { checkId: 'U-08', status: 'skip', durationMs: 0, message: 'logging capability not declared' }
    }

    const tStart = performance.now()
    const failed: string[] = []

    for (const level of LEVELS) {
      const out = await ctx.client.call('logging/setLevel', { level })
      if (out.error) {
        failed.push(level)
      }
    }

    const durationMs = performance.now() - tStart

    if (failed.length === 0) {
      return {
        checkId: 'U-08',
        status: 'pass',
        durationMs,
        evidence: { actual: LEVELS.join(',') },
      }
    }

    return {
      checkId: 'U-08',
      status: 'fail',
      durationMs,
      message: `logging/setLevel rejected level(s): ${failed.join(', ')}`,
      evidence: {
        expected: LEVELS.join(','),
        actual: failed.join(','),
      },
    }
  },
}

export default check
