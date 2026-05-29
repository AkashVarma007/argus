import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'TL-09',
  category: 'tools',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Schema-violating tool input returns result.isError: true (not -32602)',
  probe: 'Find a tool with required field, call with empty arguments; expect result.isError.',
  criterion: 'Schema violations MUST surface as `result.isError: true`, NOT JSON-RPC error.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'Error handling',
    quote: 'Tool execution errors MUST be reported via isError: true in the result, not as JSON-RPC errors.',
  },
  requires: ['tools'],
  deterministic: true,
  async run(ctx) {
    if (!ctx.capabilities?.tools) {
      return { checkId: 'TL-09', status: 'skip', durationMs: 0, message: 'tools capability not declared' }
    }
    const tStart = performance.now()
    const list = await ctx.client.call('tools/list', {})
    const tools = Array.isArray((list.result as Record<string, unknown>)?.tools)
      ? ((list.result as Record<string, unknown>).tools as unknown[])
      : []
    const tool = tools.find((t) => {
      const item = t as Record<string, unknown>
      const schema = item?.inputSchema as Record<string, unknown> | undefined
      return Array.isArray(schema?.required) && (schema.required as unknown[]).length > 0
    }) as Record<string, unknown> | undefined

    if (!tool) {
      const durationMs = performance.now() - tStart
      return { checkId: 'TL-09', status: 'skip', durationMs, message: 'No tool with required input found.' }
    }
    if (typeof tool.name !== 'string') {
      const durationMs = performance.now() - tStart
      return { checkId: 'TL-09', status: 'skip', durationMs, message: 'tool name not a string' }
    }
    const { error, result, raw } = await ctx.client.call('tools/call', { name: tool.name, arguments: {} })
    const durationMs = performance.now() - tStart
    if (!error && (result as Record<string, unknown>)?.isError === true) {
      return { checkId: 'TL-09', status: 'pass', durationMs, evidence: { response: { body: raw } } }
    }
    return {
      checkId: 'TL-09',
      status: 'fail',
      durationMs,
      message: error
        ? `Schema violation returned JSON-RPC error ${error.code} instead of result.isError.`
        : 'Schema violation did not set result.isError: true.',
      evidence: { response: { body: raw }, expected: 'result.isError: true', actual: error ?? result },
    }
  },
}

export default check
