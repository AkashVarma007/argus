import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'SL-01',
  category: 'stateless',
  severity: 'warning',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Server does not require session cookies',
  probe: 'POST initialize; check response for Set-Cookie or session-binding headers.',
  criterion: 'MCP servers SHOULD be stateless; session cookies indicate transport coupling.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: 'Statelessness',
    quote: 'Streamable HTTP servers SHOULD be stateless and not rely on session cookies.',
  },
  deterministic: true,
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'SL-01', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }
    const tStart = performance.now()
    try {
      const res = await fetch(ctx.client.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json, text/event-stream',
          'MCP-Protocol-Version': ctx.spec,
        },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1, method: 'initialize',
          params: {
            protocolVersion: ctx.spec,
            capabilities: {},
            clientInfo: { name: 'argus', version: '0.1.0' },
          },
        }),
      })
      if (!res.ok) {
        return {
          checkId: 'SL-01', status: 'error',
          durationMs: performance.now() - tStart,
          message: `Initialize POST returned HTTP ${res.status}.`,
          evidence: { actual: { status: res.status } },
        }
      }
      const cookie = res.headers.get('set-cookie')
      if (!cookie) {
        return {
          checkId: 'SL-01',
          status: 'pass',
          durationMs: performance.now() - tStart,
          evidence: { response: { body: null }, actual: 'no Set-Cookie' },
        }
      }
      return {
        checkId: 'SL-01',
        status: 'fail',
        durationMs: performance.now() - tStart,
        message: `Server set cookie: "${cookie.slice(0, 80)}".`,
        evidence: {
          response: { body: null },
          expected: 'no Set-Cookie header',
          actual: cookie,
        },
      }
    } catch (err) {
      return {
        checkId: 'SL-01',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `SL-01 probe threw: ${(err as Error).message}`,
      }
    }
  },
}

export default check
