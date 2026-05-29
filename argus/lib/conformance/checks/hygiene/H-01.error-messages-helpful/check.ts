import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'H-01', category: 'hygiene', severity: 'warning', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Error messages are non-empty and informative',
  probe: 'Trigger a known error (unknown method); inspect error.message.',
  criterion: 'message SHOULD be a non-trivial string (≥5 chars, not just code number).',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: 'Error reporting hygiene',
    quote: 'Implementations SHOULD provide human-readable error messages.',
  },
  deterministic: true,
  async run(ctx) {
    const tStart = performance.now()
    const { error, raw } = await ctx.client.call('nonexistent/method', {})
    const msg = error?.message ?? ''
    const durationMs = performance.now() - tStart
    if (msg.length >= 5 && !/^-?\d+$/.test(msg)) {
      return { checkId: 'H-01', status: 'pass', durationMs, evidence: { actual: msg } }
    }
    return {
      checkId: 'H-01', status: 'fail', durationMs,
      message: `Error message too short or numeric-only: "${msg}".`,
      evidence: { response: { body: raw }, expected: 'human-readable string ≥5 chars' },
    }
  },
}
export default check
