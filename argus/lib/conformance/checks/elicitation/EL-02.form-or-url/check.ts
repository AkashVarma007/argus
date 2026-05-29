import type { Check } from '@/lib/conformance/types'
import type { CallOutcome } from '@/lib/conformance/client'
import type { JsonRpcRequest } from '@/lib/conformance/helpers/jsonrpc'

const check: Check = {
  id: 'EL-02',
  category: 'elicitation',
  severity: 'error',
  confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'elicitation/create request includes either form schema or url',
  probe: 'Capture elicitation/create back-request via client.onRequest; inspect params shape.',
  criterion: 'Request MUST contain exactly one of `requestedSchema` (form variant) or `url` (URL variant).',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation',
    section: 'create request',
    quote: 'An elicitation request specifies either a JSON Schema for form rendering or a URL for an external prompt.',
  },
  deterministic: false,
  async run(ctx) {
    const tStart = performance.now()
    const list = await ctx.client.call('tools/list', {})
    if (list.error) {
      return {
        checkId: 'EL-02',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `tools/list returned error ${list.error.code}: ${list.error.message}`,
        evidence: { response: { body: list.error } },
      }
    }
    const rawTools = (list.result as { tools?: unknown })?.tools
    const tools: unknown[] = Array.isArray(rawTools) ? rawTools : []
    const probe = tools.find((t) => (t as Record<string, unknown>)?.name === '__torture/elicitation-probe')
    if (!probe) {
      return {
        checkId: 'EL-02',
        status: 'skip',
        durationMs: performance.now() - tStart,
        message: 'No __torture/elicitation-probe tool available.',
      }
    }

    const captured: JsonRpcRequest[] = []
    ctx.client.onRequest((req: JsonRpcRequest) => {
      if (req.method === 'elicitation/create') captured.push(req)
      return { action: 'accept', content: {} }
    })

    let callOut: CallOutcome
    try {
      callOut = await ctx.client.call('tools/call', { name: '__torture/elicitation-probe', arguments: {} })
    } finally {
      ctx.client.onRequest(null)
    }

    const durationMs = performance.now() - tStart

    if (callOut.error) {
      return {
        checkId: 'EL-02',
        status: 'error',
        durationMs,
        message: `tools/call returned error ${callOut.error.code}: ${callOut.error.message}`,
        evidence: { response: { body: callOut.error } },
      }
    }

    if (captured.length === 0) {
      return {
        checkId: 'EL-02',
        status: 'skip',
        durationMs,
        message: 'Server never issued elicitation/create.',
      }
    }

    const req = captured[0]
    const params = req.params as Record<string, unknown> | undefined
    const hasForm = !!params?.requestedSchema
    const hasUrl = typeof params?.url === 'string'
    // Pass = exactly one of requestedSchema or url present (XOR).
    if (hasForm !== hasUrl) {
      return {
        checkId: 'EL-02',
        status: 'pass',
        durationMs,
        evidence: { response: { body: req }, actual: params },
      }
    }
    return {
      checkId: 'EL-02',
      status: 'fail',
      durationMs,
      message: hasForm && hasUrl
        ? 'elicitation/create contains both requestedSchema and url.'
        : 'elicitation/create contains neither requestedSchema nor url.',
      evidence: {
        response: { body: req },
        actual: params,
        expected: 'exactly one of requestedSchema|url',
      },
    }
  },
}

export default check
