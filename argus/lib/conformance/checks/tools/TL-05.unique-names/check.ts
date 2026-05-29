import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'TL-05',
  category: 'tools',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Tools list has no duplicate names',
  probe: 'Collect all tool names; check for duplicates.',
  criterion: 'Tool names MUST be unique within the list.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'Tool definition',
    quote: 'Tool names MUST be unique within a server.',
  },
  requires: ['tools'],
  deterministic: true,
  async run(ctx) {
    if (!ctx.capabilities?.tools) {
      return { checkId: 'TL-05', status: 'skip', durationMs: 0, message: 'tools capability not declared' }
    }
    const tStart = performance.now()
    const { result, error } = await ctx.client.call('tools/list', {})
    const durationMs = performance.now() - tStart
    if (error) {
      return {
        checkId: 'TL-05',
        status: 'error',
        durationMs,
        message: `tools/list returned error ${error.code}: ${error.message}`,
        evidence: { response: { body: error } },
      }
    }
    const rawTools = (result as { tools?: unknown })?.tools
    if (!Array.isArray(rawTools)) {
      return {
        checkId: 'TL-05',
        status: 'fail',
        durationMs,
        message: 'tools/list did not return a tools array',
        evidence: { response: { body: result }, expected: '{ tools: [...] }', actual: result },
      }
    }
    const tools: unknown[] = rawTools
    const seen = new Set<string>()
    const dupes = new Set<string>()
    for (const t of tools) {
      const tool = t as Record<string, unknown>
      const name = typeof tool?.name === 'string' ? tool.name : '(unknown)'
      if (seen.has(name)) dupes.add(name)
      seen.add(name)
    }
    if (dupes.size === 0) {
      return { checkId: 'TL-05', status: 'pass', durationMs, evidence: { response: { body: result } } }
    }
    return {
      checkId: 'TL-05',
      status: 'fail',
      durationMs,
      message: `Duplicate tool names: ${[...dupes].join(', ')}.`,
      evidence: { actual: [...dupes], expected: 'unique names' },
    }
  },
}

export default check
