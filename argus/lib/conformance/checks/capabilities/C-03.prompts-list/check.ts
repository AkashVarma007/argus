import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'C-03',
  category: 'capabilities',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  requires: ['prompts'],
  title: 'prompts/list returns an array when prompts capability declared',
  probe: 'Call prompts/list; inspect result.prompts.',
  criterion: 'If server declares prompts capability, prompts/list MUST return result.prompts as an array.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/prompts',
    section: 'Listing prompts',
    quote: 'Servers that support prompts MUST respond to prompts/list with a prompts array.',
  },
  async run(ctx) {
    if (!ctx.capabilities?.prompts) {
      return { checkId: 'C-03', status: 'skip', durationMs: 0, message: 'prompts not declared' }
    }
    const tStart = performance.now()
    const out = await ctx.client.call('prompts/list', {})
    const durationMs = performance.now() - tStart
    if (out.error) {
      return {
        checkId: 'C-03',
        status: 'fail',
        durationMs,
        message: `prompts/list returned error: ${out.error.code} ${out.error.message}`,
        evidence: { response: { body: out.error }, actual: out.error },
      }
    }
    const result = out.result as Record<string, unknown>
    if (!Array.isArray(result?.prompts)) {
      return {
        checkId: 'C-03',
        status: 'fail',
        durationMs,
        message: 'prompts/list result.prompts is not an array.',
        evidence: { response: { body: result }, expected: 'array', actual: typeof result?.prompts },
      }
    }
    return {
      checkId: 'C-03',
      status: 'pass',
      durationMs,
      evidence: {
        response: { body: result },
        actual: { promptCount: (result.prompts as unknown[]).length },
      },
    }
  },
}

export default check
