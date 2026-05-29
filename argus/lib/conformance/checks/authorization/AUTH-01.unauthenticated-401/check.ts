import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'AUTH-01',
  category: 'authorization',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['2025-11-25', 'DRAFT-2026-v1'],
  deterministic: true,
  title: 'Request without Authorization → 401 with WWW-Authenticate: Bearer',
  probe: 'POST initialize without Authorization header; expect 401.',
  criterion: 'Server MUST respond 401 and include WWW-Authenticate: Bearer ... header.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization',
    section: 'OAuth challenge',
    quote: 'Unauthenticated requests MUST receive a 401 response with a WWW-Authenticate: Bearer challenge.',
  },
  async run(ctx) {
    if (ctx.authMode !== 'oauth-discovery') {
      return { checkId: 'AUTH-01', status: 'skip', durationMs: 0, message: 'auth-mode is not oauth-discovery' }
    }
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'AUTH-01', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }

    const res = await fetch(ctx.client.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'MCP-Protocol-Version': ctx.spec,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
    })

    const wwwAuth = res.headers.get('www-authenticate') ?? ''

    if (res.status === 401 && /bearer/i.test(wwwAuth)) {
      return {
        checkId: 'AUTH-01',
        status: 'pass',
        durationMs: 0,
        evidence: { actual: { status: 401, wwwAuth } },
      }
    }

    return {
      checkId: 'AUTH-01',
      status: 'fail',
      durationMs: 0,
      message: `Expected 401 + WWW-Authenticate: Bearer, got ${res.status} ${wwwAuth ? `with WWW-Authenticate: ${wwwAuth}` : 'without WWW-Authenticate header'}.`,
      evidence: {
        expected: '401 + WWW-Authenticate: Bearer',
        actual: { status: res.status, wwwAuth },
      },
    }
  },
}

export default check
