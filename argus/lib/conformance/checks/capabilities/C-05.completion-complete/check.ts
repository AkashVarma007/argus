import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'C-05',
  category: 'capabilities',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  requires: ['completions'],
  title: 'completion/complete returns result.completion when completions capability declared',
  probe: 'Call completion/complete with a ref/prompt reference; inspect result.completion.',
  criterion: 'If server declares completions capability, completion/complete MUST return result.completion.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/utilities/completion',
    section: 'Completing arguments',
    quote: 'Servers that support completions MUST respond to completion/complete with a completion object.',
  },
  async run(ctx) {
    if (!ctx.capabilities?.completions) {
      return { checkId: 'C-05', status: 'skip', durationMs: 0, message: 'completions not declared' }
    }
    const tStart = performance.now()
    const out = await ctx.client.call('completion/complete', {
      ref: { type: 'ref/prompt', name: 'x' },
      argument: { name: 'a', value: 'b' },
    })
    const durationMs = performance.now() - tStart
    if (out.error) {
      return {
        checkId: 'C-05',
        status: 'fail',
        durationMs,
        message: `completion/complete returned error: ${out.error.code} ${out.error.message}`,
        evidence: { response: { body: out.error }, actual: out.error },
      }
    }
    const result = out.result as Record<string, unknown>
    if (result?.completion == null) {
      return {
        checkId: 'C-05',
        status: 'fail',
        durationMs,
        message: 'completion/complete result.completion is missing.',
        evidence: { response: { body: result }, expected: 'result.completion object', actual: result?.completion },
      }
    }
    return {
      checkId: 'C-05',
      status: 'pass',
      durationMs,
      evidence: {
        response: { body: result },
        actual: { completion: result.completion },
      },
    }
  },
}

export default check
