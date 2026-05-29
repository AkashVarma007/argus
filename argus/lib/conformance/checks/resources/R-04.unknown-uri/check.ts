import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'R-04',
  category: 'resources',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'resources/read with unknown uri returns error',
  probe: 'Call resources/read with `uri: "argus://nonexistent/9999"`.',
  criterion: 'Unknown URI MUST yield JSON-RPC error.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/resources',
    section: 'resources/read',
    quote: 'If the resource does not exist, the server MUST return an error.',
  },
  requires: ['resources'],
  deterministic: true,
  async run(ctx) {
    if (!ctx.capabilities?.resources) {
      return { checkId: 'R-04', status: 'skip', durationMs: 0, message: 'resources capability not declared' }
    }
    const tStart = performance.now()
    const { error, result } = await ctx.client.call('resources/read', { uri: 'argus://nonexistent/9999' })
    const durationMs = performance.now() - tStart
    if (error) {
      return {
        checkId: 'R-04',
        status: 'pass',
        durationMs,
        evidence: { response: { body: error }, actual: error.code },
      }
    }
    return {
      checkId: 'R-04',
      status: 'fail',
      durationMs,
      message: 'Unknown resource URI returned success instead of JSON-RPC error.',
      evidence: { response: { body: result }, expected: 'JSON-RPC error' },
    }
  },
}

export default check
