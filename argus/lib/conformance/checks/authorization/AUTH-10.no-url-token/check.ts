import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'AUTH-10',
  category: 'authorization',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['2025-11-25', 'DRAFT-2026-v1'],
  deterministic: true,
  title: 'Tokens passed via URL query parameter are rejected',
  probe: 'POST initialize with ?access_token=xxx in URL; expect 4xx error.',
  criterion: 'Server MUST NOT accept access tokens in URL parameters (only Authorization header).',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization',
    section: 'Token transmission',
    quote: 'Access tokens MUST NOT be transmitted in URL parameters.',
  },
  async run(ctx) {
    if (ctx.authMode !== 'oauth-discovery') {
      return { checkId: 'AUTH-10', status: 'skip', durationMs: 0, message: 'auth-mode is not oauth-discovery' }
    }
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'AUTH-10', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }

    // Use 'initialize' because it is exempt from the MCP-Protocol-Version header requirement,
    // so a compliant server's only valid rejection is the 401 auth challenge, not a protocol error.
    const u = new URL(ctx.client.url)
    u.searchParams.set('access_token', 'fake-token-for-argus-probe')
    const res = await fetch(u.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
    })

    if (res.status >= 400 && res.status < 500) {
      return {
        checkId: 'AUTH-10',
        status: 'pass',
        durationMs: 0,
        evidence: { actual: { status: res.status } },
      }
    }

    return {
      checkId: 'AUTH-10',
      status: 'fail',
      durationMs: 0,
      message: `Server accepted access token in URL parameter (status ${res.status}); tokens MUST NOT be passed via URL.`,
      evidence: {
        expected: '4xx rejection',
        actual: { status: res.status },
      },
    }
  },
}

export default check
