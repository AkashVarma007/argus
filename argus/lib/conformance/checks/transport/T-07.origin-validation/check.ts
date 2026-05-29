import type { Check } from '@/lib/conformance/types'
import { renderCurl } from '@/lib/conformance/helpers/curl'

const check: Check = {
  id: 'T-07',
  category: 'transport',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['2025-11-25', 'DRAFT-2026-v1'],
  deterministic: true,
  title: 'Server validates Origin header (DNS-rebinding protection)',
  probe: 'POST /mcp with Origin: https://evil.example.com',
  criterion: 'Server returns HTTP 403 Forbidden',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports#security-warning',
    section: '§ Security Warning',
    quote: 'Servers MUST validate the Origin header on all incoming connections to prevent DNS rebinding attacks. If the Origin header is present and invalid, servers MUST respond with HTTP 403 Forbidden.',
  },
  async run(ctx) {
    const start = performance.now()
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json, text/event-stream',
      'Origin': 'https://evil.example.com',
      'MCP-Protocol-Version': ctx.spec,
    }
    const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'ping' })
    const res = await ctx.rawHttp.fetch({ method: 'POST', headers, body })
    const durationMs = performance.now() - start
    const evidence = {
      request: { method: 'POST', url: ctx.rawHttp.url, headers, body: JSON.parse(body) },
      response: { status: res.status, headers: res.headers, body: await res.text() },
      expected: 403,
      actual: res.status,
      curlCommand: renderCurl({ method: 'POST', url: ctx.rawHttp.url, headers, body }),
    }
    if (res.status === 403) {
      return { checkId: 'T-07', status: 'pass', durationMs, evidence }
    }
    return {
      checkId: 'T-07',
      status: 'fail',
      message: `Expected 403 for bogus Origin, got ${res.status}. Server is vulnerable to DNS rebinding attacks.`,
      durationMs,
      evidence,
    }
  },
}

export default check
