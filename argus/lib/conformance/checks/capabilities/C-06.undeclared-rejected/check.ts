import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'C-06',
  category: 'capabilities',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  title: 'tools/list rejected when tools capability not declared',
  probe: 'When tools capability is absent, call tools/list; expect -32601 Method not found.',
  criterion: 'If server does NOT declare tools capability, tools/list MUST return error -32601.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'Capability negotiation',
    quote: 'Servers MUST NOT accept capability-gated method calls when the capability was not declared.',
  },
  async run(ctx) {
    if (ctx.capabilities?.tools) {
      return { checkId: 'C-06', status: 'skip', durationMs: 0, message: 'tools is declared; check not applicable' }
    }
    const tStart = performance.now()
    const out = await ctx.client.call('tools/list', {})
    const durationMs = performance.now() - tStart
    if (out.error?.code === -32601) {
      return {
        checkId: 'C-06',
        status: 'pass',
        durationMs,
        evidence: {
          response: { body: out.error },
          actual: { code: out.error.code, message: out.error.message },
        },
      }
    }
    const actualCode = out.error?.code ?? (out.result !== undefined ? 'result (no error)' : 'unknown')
    return {
      checkId: 'C-06',
      status: 'fail',
      durationMs,
      message: `Expected -32601 for undeclared tools/list, got: ${JSON.stringify(actualCode)}`,
      evidence: {
        response: { body: out.error ?? out.result },
        expected: -32601,
        actual: actualCode,
      },
    }
  },
}

export default check
