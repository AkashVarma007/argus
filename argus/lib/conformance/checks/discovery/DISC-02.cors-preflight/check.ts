import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'DISC-02',
  category: 'discovery',
  severity: 'warning',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'OPTIONS preflight allows POST + Content-Type + MCP-Protocol-Version',
  probe: 'Send OPTIONS with Access-Control-Request-* headers; inspect response.',
  criterion: 'Server MUST return Access-Control-Allow-Methods including POST and Allow-Headers including Content-Type, MCP-Protocol-Version.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: 'CORS',
    quote: 'Servers MUST handle CORS preflight requests for browser clients.',
  },
  deterministic: true,
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'DISC-02', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }
    const tStart = performance.now()
    try {
      const res = await fetch(ctx.client.url, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://argus.local',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type, mcp-protocol-version',
        },
      })
      const allowMethods = (res.headers.get('access-control-allow-methods') ?? '').toLowerCase()
      const allowHeaders = (res.headers.get('access-control-allow-headers') ?? '').toLowerCase()
      const ok =
        allowMethods.includes('post') &&
        allowHeaders.includes('content-type') &&
        allowHeaders.includes('mcp-protocol-version')
      if (ok) {
        return {
          checkId: 'DISC-02',
          status: 'pass',
          durationMs: performance.now() - tStart,
          evidence: { actual: { allowMethods, allowHeaders } },
        }
      }
      return {
        checkId: 'DISC-02',
        status: 'fail',
        durationMs: performance.now() - tStart,
        message: 'CORS preflight missing required Allow-Methods or Allow-Headers.',
        evidence: { expected: 'POST + content-type + mcp-protocol-version', actual: { allowMethods, allowHeaders } },
      }
    } catch (err) {
      return {
        checkId: 'DISC-02',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `CORS preflight probe threw: ${(err as Error).message}`,
      }
    }
  },
}

export default check
