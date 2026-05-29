import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'AUTH-02',
  category: 'authorization',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['2025-11-25', 'DRAFT-2026-v1'],
  deterministic: true,
  title: 'WWW-Authenticate includes resource_metadata="..." URL',
  probe: 'Inspect the WWW-Authenticate header value from AUTH-01.',
  criterion: 'Bearer challenge MUST include resource_metadata="https://..." parameter.',
  specRef: {
    url: 'https://datatracker.ietf.org/doc/html/rfc9728',
    section: 'RFC 9728',
    quote: 'The Bearer challenge SHOULD include resource_metadata pointing to the protected-resource metadata document.',
  },
  async run(ctx) {
    if (ctx.authMode !== 'oauth-discovery') {
      return { checkId: 'AUTH-02', status: 'skip', durationMs: 0, message: 'auth-mode is not oauth-discovery' }
    }
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'AUTH-02', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
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
    const m = /resource_metadata="([^"]+)"/i.exec(wwwAuth)

    if (m && /^https?:\/\//i.test(m[1])) {
      return {
        checkId: 'AUTH-02',
        status: 'pass',
        durationMs: 0,
        evidence: { actual: { resource_metadata: m[1] } },
      }
    }

    return {
      checkId: 'AUTH-02',
      status: 'fail',
      durationMs: 0,
      message: `WWW-Authenticate header does not include a valid resource_metadata URL. Got: ${wwwAuth || '(empty)'}`,
      evidence: {
        expected: 'Bearer ... resource_metadata="https://..."',
        actual: { wwwAuth },
      },
    }
  },
}

export default check
