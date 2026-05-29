import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'TL-08',
  category: 'tools',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'tools/call with unknown name returns protocol error',
  probe: 'Call tools/call with name "definitely_not_a_tool".',
  criterion: 'Unknown tool name MUST yield JSON-RPC error (not result.isError).',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'tools/call',
    quote: 'If the tool does not exist, the server MUST return an error.',
  },
  requires: ['tools'],
  deterministic: true,
  async run(ctx) {
    if (!ctx.capabilities?.tools) {
      return { checkId: 'TL-08', status: 'skip', durationMs: 0, message: 'tools capability not declared' }
    }
    const tStart = performance.now()
    const { error, result, raw } = await ctx.client.call('tools/call', {
      name: 'definitely_not_a_tool',
      arguments: {},
    })
    const durationMs = performance.now() - tStart
    if (error) {
      return { checkId: 'TL-08', status: 'pass', durationMs, evidence: { response: { body: raw }, actual: error.code } }
    }
    return {
      checkId: 'TL-08',
      status: 'fail',
      durationMs,
      message: 'Unknown tool returned success result instead of JSON-RPC error.',
      evidence: { response: { body: raw }, expected: 'JSON-RPC error', actual: result },
    }
  },
}

export default check
