import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'C-04',
  category: 'capabilities',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  requires: ['logging'],
  title: 'logging/setLevel succeeds when logging capability declared',
  probe: 'Call logging/setLevel with {level:"info"}; expect non-error response.',
  criterion: 'If server declares logging capability, logging/setLevel MUST return a non-error result.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/utilities/logging',
    section: 'Setting log level',
    quote: 'Servers that support logging MUST handle logging/setLevel requests.',
  },
  async run(ctx) {
    if (!ctx.capabilities?.logging) {
      return { checkId: 'C-04', status: 'skip', durationMs: 0, message: 'logging not declared' }
    }
    const tStart = performance.now()
    const out = await ctx.client.call('logging/setLevel', { level: 'info' })
    const durationMs = performance.now() - tStart
    if (out.error || out.result === undefined) {
      return {
        checkId: 'C-04',
        status: 'fail',
        durationMs,
        message: out.error
          ? `logging/setLevel returned error: ${out.error.code} ${out.error.message}`
          : 'logging/setLevel returned no result',
        evidence: { response: { body: out.error ?? null }, actual: out.error ?? null },
      }
    }
    return {
      checkId: 'C-04',
      status: 'pass',
      durationMs,
      evidence: {
        response: { body: out.result },
        actual: { result: out.result },
      },
    }
  },
}

export default check
