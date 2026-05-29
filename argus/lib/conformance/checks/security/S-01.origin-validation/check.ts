import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'S-01', category: 'security', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Server rejects requests with disallowed Origin header',
  probe: 'Same probe as T-07 (Origin: https://attacker.example) — but classified as security here.',
  criterion: 'Origin enforcement is a security boundary; missing it = DNS rebinding risk.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices',
    section: 'Origin validation',
    quote: 'Servers MUST validate the Origin header to prevent DNS rebinding attacks.',
  },
  deterministic: true,
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'S-01', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }
    const url = ctx.client.url
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Origin: 'https://attacker.example',
        'MCP-Protocol-Version': ctx.spec,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' }),
    })
    if (res.status === 403 || res.status === 400) {
      return { checkId: 'S-01', status: 'pass', durationMs: 0, evidence: { actual: { status: res.status } } }
    }
    return {
      checkId: 'S-01', status: 'fail', durationMs: 0,
      message: `Server accepted disallowed Origin (status ${res.status}). DNS rebinding risk.`,
      evidence: { expected: '403 or 400', actual: { status: res.status } },
    }
  },
}
export default check
