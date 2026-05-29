import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'P-01',
  category: 'prompts',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Every prompt has name; description and arguments typed correctly if present',
  probe: 'List prompts; verify name is string, arguments is array if present.',
  criterion:
    'Prompt MUST have string `name`; `arguments` (if present) MUST be array of `{ name, description?, required? }`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/prompts',
    section: 'Prompt definition',
    quote: 'Each prompt has a name and may have arguments.',
  },
  requires: ['prompts'],
  deterministic: true,
  async run(ctx) {
    if (!ctx.capabilities?.prompts) {
      return { checkId: 'P-01', status: 'skip', durationMs: 0, message: 'prompts capability not declared' }
    }
    const tStart = performance.now()
    const { result, error } = await ctx.client.call('prompts/list', {})
    const durationMs = performance.now() - tStart
    if (error) {
      return {
        checkId: 'P-01',
        status: 'error',
        durationMs,
        message: `prompts/list returned error ${error.code}: ${error.message}`,
        evidence: { response: { body: error } },
      }
    }
    const rawPrompts = (result as { prompts?: unknown })?.prompts
    if (!Array.isArray(rawPrompts)) {
      return {
        checkId: 'P-01',
        status: 'fail',
        durationMs,
        message: 'prompts/list did not return a prompts array',
        evidence: { response: { body: result }, expected: '{ prompts: [...] }', actual: result },
      }
    }
    const prompts: unknown[] = rawPrompts
    const bad: { prompt: string; issues: string[] }[] = []
    for (const p of prompts) {
      const prompt = p as Record<string, unknown>
      const issues: string[] = []
      if (typeof prompt?.name !== 'string') issues.push('name not string')
      if ('arguments' in prompt && !Array.isArray(prompt.arguments)) issues.push('arguments not array')
      if (Array.isArray(prompt.arguments)) {
        for (const a of prompt.arguments) {
          const arg = a as Record<string, unknown>
          if (typeof arg?.name !== 'string') issues.push('argument.name not string')
        }
      }
      if (issues.length) {
        bad.push({ prompt: typeof prompt?.name === 'string' ? prompt.name : '?', issues })
      }
    }
    if (bad.length === 0) {
      return { checkId: 'P-01', status: 'pass', durationMs, evidence: { response: { body: result } } }
    }
    return {
      checkId: 'P-01',
      status: 'fail',
      durationMs,
      message: `${bad.length} prompt(s) malformed.`,
      evidence: {
        response: { body: result },
        actual: bad,
        expected: '{ name: string, arguments?: Array<{ name: string }> }',
      },
    }
  },
}

export default check
