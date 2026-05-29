import type { Check } from '@/lib/conformance/types'
import type { CallOutcome } from '@/lib/conformance/client'
import type { JsonRpcRequest } from '@/lib/conformance/helpers/jsonrpc'

const check: Check = {
  id: 'SMP-02',
  category: 'sampling',
  severity: 'error',
  confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'sampling/createMessage back-request has messages array',
  probe: 'Capture sampling/createMessage back-request via client.onRequest; inspect params shape.',
  criterion: 'Server-initiated sampling/createMessage MUST include `messages: [...]`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/client/sampling',
    section: 'createMessage request',
    quote: 'The request includes messages, modelPreferences, and other generation parameters.',
  },
  deterministic: false,
  async run(ctx) {
    const tStart = performance.now()
    const list = await ctx.client.call('tools/list', {})
    if (list.error) {
      return {
        checkId: 'SMP-02',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `tools/list returned error ${list.error.code}: ${list.error.message}`,
        evidence: { response: { body: list.error } },
      }
    }
    const rawTools = (list.result as { tools?: unknown })?.tools
    const tools: unknown[] = Array.isArray(rawTools) ? rawTools : []
    const probe = tools.find((t) => (t as Record<string, unknown>)?.name === '__torture/sampling-probe')
    if (!probe) {
      return {
        checkId: 'SMP-02',
        status: 'skip',
        durationMs: performance.now() - tStart,
        message: 'No __torture/sampling-probe tool available.',
      }
    }

    const captured: JsonRpcRequest[] = []
    ctx.client.onRequest((req: JsonRpcRequest) => {
      if (req.method === 'sampling/createMessage') captured.push(req)
      return { content: [{ type: 'text', text: 'ack' }], model: 'argus-stub', role: 'assistant' }
    })

    let callOut: CallOutcome
    try {
      callOut = await ctx.client.call('tools/call', { name: '__torture/sampling-probe', arguments: {} })
    } finally {
      ctx.client.onRequest(null)
    }

    const durationMs = performance.now() - tStart

    if (callOut.error) {
      return {
        checkId: 'SMP-02',
        status: 'error',
        durationMs,
        message: `tools/call returned error ${callOut.error.code}: ${callOut.error.message}`,
        evidence: { response: { body: callOut.error } },
      }
    }

    if (captured.length === 0) {
      return {
        checkId: 'SMP-02',
        status: 'skip',
        durationMs,
        message: 'Server never issued sampling/createMessage.',
      }
    }

    const req = captured[0]
    const params = req.params as Record<string, unknown> | undefined
    const hasMessages = Array.isArray(params?.messages)
    if (hasMessages) {
      return {
        checkId: 'SMP-02',
        status: 'pass',
        durationMs,
        evidence: { response: { body: req }, actual: params?.messages },
      }
    }
    return {
      checkId: 'SMP-02',
      status: 'fail',
      durationMs,
      message: 'sampling/createMessage back-request missing `messages` array.',
      evidence: { response: { body: req }, expected: 'messages: []', actual: params },
    }
  },
}

export default check
