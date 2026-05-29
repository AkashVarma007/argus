import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'C-01',
  category: 'capabilities',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  requires: ['tools'],
  title: 'tools/list returns an array when tools capability declared',
  probe: 'Call tools/list; inspect result.tools.',
  criterion: 'If server declares tools capability, tools/list MUST return result.tools as an array.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'Listing tools',
    quote: 'Servers that support tools MUST respond to tools/list with a tools array.',
  },
  async run(ctx) {
    if (!ctx.capabilities?.tools) {
      return { checkId: 'C-01', status: 'skip', durationMs: 0, message: 'tools not declared' }
    }
    const tStart = performance.now()
    const out = await ctx.client.call('tools/list', {})
    const durationMs = performance.now() - tStart
    if (out.error) {
      return {
        checkId: 'C-01',
        status: 'fail',
        durationMs,
        message: `tools/list returned error: ${out.error.code} ${out.error.message}`,
        evidence: { response: { body: out.error }, actual: out.error },
      }
    }
    const result = out.result as Record<string, unknown>
    if (!Array.isArray(result?.tools)) {
      return {
        checkId: 'C-01',
        status: 'fail',
        durationMs,
        message: 'tools/list result.tools is not an array.',
        evidence: { response: { body: result }, expected: 'array', actual: typeof result?.tools },
      }
    }
    return {
      checkId: 'C-01',
      status: 'pass',
      durationMs,
      evidence: {
        response: { body: result },
        actual: { toolCount: (result.tools as unknown[]).length },
      },
    }
  },
}

export default check
