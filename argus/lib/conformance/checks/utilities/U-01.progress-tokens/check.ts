import type { Check } from '@/lib/conformance/types'
import type { JsonRpcNotification } from '@/lib/conformance/helpers/jsonrpc'

const check: Check = {
  id: 'U-01',
  category: 'utilities',
  severity: 'warning',
  confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Server emits notifications/progress when progressToken present',
  probe: 'Call __torture/slow-tool with _meta.progressToken; collect notifications/progress SSE events; verify at least one arrives with the matching token.',
  criterion: 'When a client sends a request with _meta.progressToken, the server SHOULD emit notifications/progress with that token.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/utilities/progress',
    section: 'Progress notifications',
    quote: 'Servers SHOULD send notifications/progress when the client provided a progressToken.',
  },
  deterministic: false,
  slow: true,
  async run(ctx) {
    const tStart = performance.now()

    const list = await ctx.client.call('tools/list', {})
    if (list.error) {
      return {
        checkId: 'U-01',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `tools/list returned error ${list.error.code}: ${list.error.message}`,
        evidence: { response: { body: list.error } },
      }
    }
    const rawTools = (list.result as { tools?: unknown })?.tools
    const tools: unknown[] = Array.isArray(rawTools) ? rawTools : []
    const probe = tools.find((t) => (t as Record<string, unknown>)?.name === '__torture/slow-tool')
    if (!probe) {
      return {
        checkId: 'U-01',
        status: 'skip',
        durationMs: performance.now() - tStart,
        message: 'No __torture/slow-tool available.',
      }
    }

    const progressToken = `argus-u01-${Date.now()}`
    const matching: JsonRpcNotification[] = []

    ctx.client.onNotification((n: JsonRpcNotification) => {
      if (n.method === 'notifications/progress') {
        const p = n.params as Record<string, unknown> | undefined
        if (p?.progressToken === progressToken) matching.push(n)
      }
    })

    let callError: { code: number; message: string; data?: unknown } | undefined
    let callResult: unknown
    try {
      const out = await ctx.client.call('tools/call', {
        name: '__torture/slow-tool',
        arguments: { delayMs: 400 },
        _meta: { progressToken },
      })
      callError = out.error
      callResult = out.result
    } finally {
      ctx.client.onNotification(null)
    }

    const durationMs = performance.now() - tStart

    if (callError) {
      return {
        checkId: 'U-01',
        status: 'fail',
        durationMs,
        message: `tools/call returned error ${callError.code}: ${callError.message}`,
        evidence: { response: { body: callError }, actual: callError.code },
      }
    }

    if (matching.length === 0) {
      return {
        checkId: 'U-01',
        status: 'fail',
        durationMs,
        message: 'Server emitted no notifications/progress with the matching progressToken.',
        evidence: {
          expected: '≥1 notifications/progress with matching token',
          actual: matching.length,
        },
      }
    }

    return {
      checkId: 'U-01',
      status: 'pass',
      durationMs,
      evidence: {
        response: { body: callResult },
        actual: matching.length,
      },
    }
  },
}

export default check
