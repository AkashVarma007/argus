import type { Check } from '@/lib/conformance/types'
import type { JsonRpcRequest } from '@/lib/conformance/helpers/jsonrpc'

const check: Check = {
  id: 'RC-03',
  category: 'rc',
  severity: 'warning',
  confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1'],
  title: 'URL-mode elicitation request has https URL',
  probe: 'Call __torture/elicitation-url-probe; verify request.params.url is HTTPS.',
  criterion: 'When elicitation/create uses URL mode, url MUST be https:// (not data:, javascript:, http:).',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/draft-2026-v1',
    section: 'URL-mode elicitation',
    quote: 'URL-mode elicitation request: url MUST be https.',
  },
  deterministic: false,
  async run(ctx) {
    const tStart = performance.now()

    // Inline-check: look for the URL probe tool in tools/list.
    const list = await ctx.client.call('tools/list', {})
    if (list.error) {
      return {
        checkId: 'RC-03',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `tools/list returned error ${list.error.code}: ${list.error.message}`,
        evidence: { response: { body: list.error } },
      }
    }
    const rawTools = (list.result as { tools?: unknown })?.tools
    const tools: unknown[] = Array.isArray(rawTools) ? rawTools : []
    const probe = tools.find(
      (t) => (t as Record<string, unknown>)?.name === '__torture/elicitation-url-probe',
    )
    if (!probe) {
      return {
        checkId: 'RC-03',
        status: 'skip',
        durationMs: performance.now() - tStart,
        message: 'No __torture/elicitation-url-probe tool available.',
      }
    }

    const captured: JsonRpcRequest[] = []
    ctx.client.onRequest((req: JsonRpcRequest) => {
      if (req.method === 'elicitation/create') captured.push(req)
      return { action: 'cancel' }
    })

    try {
      await ctx.client.call('tools/call', { name: '__torture/elicitation-url-probe', arguments: {} })
    } finally {
      ctx.client.onRequest(null)
    }

    const durationMs = performance.now() - tStart

    if (captured.length === 0) {
      return {
        checkId: 'RC-03',
        status: 'skip',
        durationMs,
        message: 'No URL elicitation observed.',
      }
    }

    const url = (captured[0]?.params as Record<string, unknown> | undefined)?.url
    if (typeof url === 'string') {
      let parsed: URL | null = null
      try {
        parsed = new URL(url)
      } catch {
        return {
          checkId: 'RC-03',
          status: 'fail',
          durationMs,
          message: 'Elicitation URL is malformed',
          evidence: { actual: url },
        }
      }
      if (parsed.protocol === 'https:') {
        return {
          checkId: 'RC-03',
          status: 'pass',
          durationMs,
          evidence: { actual: url },
        }
      }
    }
    return {
      checkId: 'RC-03',
      status: 'fail',
      durationMs,
      message: `URL-mode elicitation url is "${String(url)}" (must be https://).`,
      evidence: { expected: 'https://...', actual: url },
    }
  },
}

export default check
