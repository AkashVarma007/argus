import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'P-04',
  category: 'prompts',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'prompts/get without required argument returns error',
  probe: 'Find a prompt with required argument; call prompts/get without it.',
  criterion: 'Server MUST return JSON-RPC error when required argument missing.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/prompts',
    section: 'prompts/get',
    quote: 'If required arguments are missing, the server MUST return an error.',
  },
  requires: ['prompts'],
  deterministic: true,
  async run(ctx) {
    if (!ctx.capabilities?.prompts) {
      return { checkId: 'P-04', status: 'skip', durationMs: 0, message: 'prompts capability not declared' }
    }
    const tStart = performance.now()
    const list = await ctx.client.call('prompts/list', {})
    if (list.error) {
      const durationMs = performance.now() - tStart
      return {
        checkId: 'P-04',
        status: 'error',
        durationMs,
        message: `prompts/list returned error ${list.error.code}: ${list.error.message}`,
        evidence: { response: { body: list.error } },
      }
    }
    const rawPrompts = (list.result as { prompts?: unknown })?.prompts
    if (!Array.isArray(rawPrompts)) {
      const durationMs = performance.now() - tStart
      return { checkId: 'P-04', status: 'skip', durationMs, message: 'No prompts array in response.' }
    }
    const prompts: unknown[] = rawPrompts
    const prompt = prompts.find((p) => {
      const item = p as Record<string, unknown>
      return Array.isArray(item?.arguments) && (item.arguments as unknown[]).some((a) => {
        const arg = a as Record<string, unknown>
        return arg.required === true
      })
    }) as Record<string, unknown> | undefined

    if (!prompt) {
      const durationMs = performance.now() - tStart
      return { checkId: 'P-04', status: 'skip', durationMs, message: 'No prompt with required argument.' }
    }
    if (typeof prompt.name !== 'string') {
      const durationMs = performance.now() - tStart
      return { checkId: 'P-04', status: 'skip', durationMs, message: 'prompt name not a string' }
    }
    const { error, raw } = await ctx.client.call('prompts/get', { name: prompt.name, arguments: {} })
    const durationMs = performance.now() - tStart
    if (error) {
      return { checkId: 'P-04', status: 'pass', durationMs, evidence: { response: { body: raw }, actual: error.code } }
    }
    return {
      checkId: 'P-04',
      status: 'fail',
      durationMs,
      message: 'Missing required argument did not produce error.',
      evidence: { response: { body: raw }, expected: 'JSON-RPC error' },
    }
  },
}

export default check
