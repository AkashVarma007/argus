import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'TL-01',
  category: 'tools',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Every tool has name, description, inputSchema',
  probe: 'List tools; inspect every entry for required fields.',
  criterion: 'Each tool MUST have string `name`, string `description`, object `inputSchema`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'Tool definition',
    quote: 'Each tool definition includes a name, description, and inputSchema.',
  },
  requires: ['tools'],
  deterministic: true,
  async run(ctx) {
    if (!ctx.capabilities?.tools) {
      return { checkId: 'TL-01', status: 'skip', durationMs: 0, message: 'tools capability not declared' }
    }
    const tStart = performance.now()
    const { result, error } = await ctx.client.call('tools/list', {})
    const durationMs = performance.now() - tStart
    if (error) {
      return {
        checkId: 'TL-01',
        status: 'error',
        durationMs,
        message: `tools/list returned error ${error.code}: ${error.message}`,
        evidence: { response: { body: error } },
      }
    }
    const rawTools = (result as { tools?: unknown })?.tools
    if (!Array.isArray(rawTools)) {
      return {
        checkId: 'TL-01',
        status: 'fail',
        durationMs,
        message: 'tools/list did not return a tools array',
        evidence: { response: { body: result }, expected: '{ tools: [...] }', actual: result },
      }
    }
    const tools: unknown[] = rawTools
    const bad: { tool: string; issues: string[] }[] = []
    for (const t of tools) {
      const tool = t as Record<string, unknown>
      const issues: string[] = []
      if (typeof tool?.name !== 'string') issues.push('name not string')
      if (typeof tool?.description !== 'string') issues.push('description not string')
      if (!tool?.inputSchema || typeof tool.inputSchema !== 'object') issues.push('inputSchema missing/not object')
      if (issues.length) bad.push({ tool: typeof tool?.name === 'string' ? tool.name : '(unknown)', issues })
    }
    if (bad.length === 0) {
      return { checkId: 'TL-01', status: 'pass', durationMs, evidence: { response: { body: result } } }
    }
    return {
      checkId: 'TL-01',
      status: 'fail',
      durationMs,
      message: `${bad.length} tool(s) missing required fields: ${bad.map((b) => b.tool).join(', ')}.`,
      evidence: {
        response: { body: result },
        actual: bad,
        expected: '{ name: string, description: string, inputSchema: object }',
      },
    }
  },
}

export default check
