import type { Check } from '@/lib/conformance/types'
import Ajv2020 from 'ajv/dist/2020'
import addFormats from 'ajv-formats'

const ajv = new Ajv2020({ strict: false, allErrors: true })
addFormats(ajv)

const check: Check = {
  id: 'TL-02',
  category: 'tools',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'inputSchema is valid JSON Schema (2020-12 default)',
  probe: 'Validate each inputSchema with ajv; report any compile errors.',
  criterion: 'inputSchema MUST parse as valid JSON Schema using the dialect from `$schema` (default 2020-12).',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'inputSchema',
    quote: 'inputSchema is a JSON Schema describing the expected parameters.',
  },
  requires: ['tools'],
  deterministic: true,
  async run(ctx) {
    if (!ctx.capabilities?.tools) {
      return { checkId: 'TL-02', status: 'skip', durationMs: 0, message: 'tools capability not declared' }
    }
    const tStart = performance.now()
    const { result, error } = await ctx.client.call('tools/list', {})
    const durationMs = performance.now() - tStart
    if (error) {
      return {
        checkId: 'TL-02',
        status: 'error',
        durationMs,
        message: `tools/list returned error ${error.code}: ${error.message}`,
        evidence: { response: { body: error } },
      }
    }
    const rawTools = (result as { tools?: unknown })?.tools
    if (!Array.isArray(rawTools)) {
      return {
        checkId: 'TL-02',
        status: 'fail',
        durationMs,
        message: 'tools/list did not return a tools array',
        evidence: { response: { body: result }, expected: '{ tools: [...] }', actual: result },
      }
    }
    const tools: unknown[] = rawTools
    const bad: { tool: string; error: string }[] = []
    for (const t of tools) {
      const tool = t as Record<string, unknown>
      if (!tool?.inputSchema || typeof tool.inputSchema !== 'object') continue
      try {
        ajv.compile(tool.inputSchema as Record<string, unknown>)
        ajv.removeSchema(tool.inputSchema as Record<string, unknown>)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e)
        bad.push({ tool: typeof tool.name === 'string' ? tool.name : '(unknown)', error: msg })
      }
    }
    if (bad.length === 0) {
      return { checkId: 'TL-02', status: 'pass', durationMs, evidence: { response: { body: result } } }
    }
    return {
      checkId: 'TL-02',
      status: 'fail',
      durationMs,
      message: `${bad.length} tool inputSchema(s) failed to compile.`,
      evidence: { actual: bad, expected: 'valid JSON Schema 2020-12' },
    }
  },
}

export default check
