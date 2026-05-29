import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'AUTH-03',
  category: 'authorization',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['2025-11-25', 'DRAFT-2026-v1'],
  deterministic: true,
  title: '.well-known/oauth-protected-resource returns valid RFC 9728 JSON',
  probe: 'Extract resource_metadata URL from AUTH-02; GET it; verify shape.',
  criterion: 'Document MUST include resource, authorization_servers[], scopes_supported[].',
  specRef: {
    url: 'https://datatracker.ietf.org/doc/html/rfc9728',
    section: 'Protected resource metadata',
    quote: 'The metadata document MUST contain the resource identifier and a list of authorization servers.',
  },
  async run(ctx) {
    if (ctx.authMode !== 'oauth-discovery') {
      return { checkId: 'AUTH-03', status: 'skip', durationMs: 0, message: 'auth-mode is not oauth-discovery' }
    }
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'AUTH-03', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }

    // POST to ctx.client.url (no auth) to get the WWW-Authenticate header.
    const challengeRes = await fetch(ctx.client.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json, text/event-stream',
        'MCP-Protocol-Version': ctx.spec,
      },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize', params: {} }),
    })

    const wwwAuth = challengeRes.headers.get('www-authenticate') ?? ''
    const m = /resource_metadata="([^"]+)"/i.exec(wwwAuth)

    if (!m) {
      return {
        checkId: 'AUTH-03',
        status: 'skip',
        durationMs: 0,
        message: 'No resource_metadata URL.',
      }
    }

    const metadataUrl = m[1]
    const metaRes = await fetch(metadataUrl)

    if (!metaRes.ok) {
      return {
        checkId: 'AUTH-03',
        status: 'fail',
        durationMs: 0,
        message: `GET ${metadataUrl} returned HTTP ${metaRes.status}.`,
        evidence: { actual: { status: metaRes.status } },
      }
    }

    let body: Record<string, unknown>
    try {
      body = (await metaRes.json()) as Record<string, unknown>
    } catch {
      return {
        checkId: 'AUTH-03',
        status: 'fail',
        durationMs: 0,
        message: `GET ${metadataUrl} returned non-JSON body.`,
        evidence: { actual: { status: metaRes.status } },
      }
    }

    const valid =
      typeof body.resource === 'string' &&
      Array.isArray(body.authorization_servers) &&
      Array.isArray(body.scopes_supported)

    if (valid) {
      return {
        checkId: 'AUTH-03',
        status: 'pass',
        durationMs: 0,
        evidence: { response: { body } },
      }
    }

    return {
      checkId: 'AUTH-03',
      status: 'fail',
      durationMs: 0,
      message: 'Protected-resource metadata document is missing required fields (resource, authorization_servers, scopes_supported).',
      evidence: {
        expected: '{ resource, authorization_servers[], scopes_supported[] }',
        actual: body,
      },
    }
  },
}

export default check
