import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'C-02',
  category: 'capabilities',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  requires: ['resources'],
  title: 'resources/list returns an array when resources capability declared',
  probe: 'Call resources/list; inspect result.resources.',
  criterion: 'If server declares resources capability, resources/list MUST return result.resources as an array.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/resources',
    section: 'Listing resources',
    quote: 'Servers that support resources MUST respond to resources/list with a resources array.',
  },
  async run(ctx) {
    if (!ctx.capabilities?.resources) {
      return { checkId: 'C-02', status: 'skip', durationMs: 0, message: 'resources not declared' }
    }
    const tStart = performance.now()
    const out = await ctx.client.call('resources/list', {})
    const durationMs = performance.now() - tStart
    if (out.error) {
      return {
        checkId: 'C-02',
        status: 'fail',
        durationMs,
        message: `resources/list returned error: ${out.error.code} ${out.error.message}`,
        evidence: { response: { body: out.error }, actual: out.error },
      }
    }
    const result = out.result as Record<string, unknown>
    if (!Array.isArray(result?.resources)) {
      return {
        checkId: 'C-02',
        status: 'fail',
        durationMs,
        message: 'resources/list result.resources is not an array.',
        evidence: { response: { body: result }, expected: 'array', actual: typeof result?.resources },
      }
    }
    return {
      checkId: 'C-02',
      status: 'pass',
      durationMs,
      evidence: {
        response: { body: result },
        actual: { resourceCount: (result.resources as unknown[]).length },
      },
    }
  },
}

export default check
