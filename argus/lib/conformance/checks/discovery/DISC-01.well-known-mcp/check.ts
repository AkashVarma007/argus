import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'DISC-01',
  category: 'discovery',
  severity: 'warning',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: '/.well-known/mcp returns valid discovery document',
  probe: 'GET <origin>/.well-known/mcp; expect JSON with `endpoint`, `transports`, `protocolVersions`.',
  criterion: 'Document MUST be valid JSON with required discovery fields.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: 'Discovery',
    quote: 'Servers SHOULD publish a discovery document at /.well-known/mcp.',
  },
  deterministic: true,
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'DISC-01', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }
    const tStart = performance.now()
    try {
      const u = new URL(ctx.client.url)
      const discoveryUrl = `${u.origin}/.well-known/mcp`
      const res = await fetch(discoveryUrl)
      if (!res.ok) {
        return {
          checkId: 'DISC-01',
          status: 'fail',
          durationMs: performance.now() - tStart,
          message: `Discovery document returned HTTP ${res.status}.`,
          evidence: { actual: { status: res.status, url: discoveryUrl } },
        }
      }
      const body = await res.json().catch(() => null)
      const ok =
        body !== null &&
        typeof body.endpoint === 'string' &&
        Array.isArray(body.transports) &&
        Array.isArray(body.protocolVersions)
      if (ok) {
        return {
          checkId: 'DISC-01',
          status: 'pass',
          durationMs: performance.now() - tStart,
          evidence: { response: { body } },
        }
      }
      return {
        checkId: 'DISC-01',
        status: 'fail',
        durationMs: performance.now() - tStart,
        message: 'Discovery document missing required fields.',
        evidence: { expected: '{ endpoint, transports[], protocolVersions[] }', actual: body },
      }
    } catch (err) {
      return {
        checkId: 'DISC-01',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `Discovery probe threw: ${(err as Error).message}`,
      }
    }
  },
}

export default check
