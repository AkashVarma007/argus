import type { Check } from '@/lib/conformance/types'
import type { JsonRpcRequest } from '@/lib/conformance/helpers/jsonrpc'

const check: Check = {
  id: 'SMP-01',
  category: 'sampling',
  severity: 'warning',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Server invokes sampling/createMessage only when client declared sampling',
  probe: 'Call __torture/sampling-probe tool; Argus responds to back-request; verify full round-trip succeeds.',
  criterion: 'Servers MUST only issue sampling/createMessage if the client declared the sampling capability.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/client/sampling',
    section: 'Capability requirement',
    quote: 'Servers MUST only issue sampling requests if the client declared the sampling capability.',
  },
  deterministic: true,
  async run(ctx) {
    const tStart = performance.now()
    const list = await ctx.client.call('tools/list', {})
    if (list.error) {
      return {
        checkId: 'SMP-01',
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
        checkId: 'SMP-01',
        status: 'skip',
        durationMs: performance.now() - tStart,
        message: 'No __torture/sampling-probe tool available.',
      }
    }

    // Respond to the back-request with a stub sampling result so the probe can succeed.
    ctx.client.onRequest((req: JsonRpcRequest) => {
      if (req.method === 'sampling/createMessage') {
        return { content: [{ type: 'text', text: 'stub' }], model: 'argus-stub', role: 'assistant' }
      }
      return {}
    })

    try {
      const { result, error, raw } = await ctx.client.call('tools/call', {
        name: '__torture/sampling-probe',
        arguments: {},
      })
      const durationMs = performance.now() - tStart
      if (error) {
        return {
          checkId: 'SMP-01',
          status: 'fail',
          durationMs,
          message: `Server failed sampling probe even though client declared sampling: ${error.message}`,
          evidence: { response: { body: raw } },
        }
      }
      const isErr = (result as Record<string, unknown> | undefined)?.isError === true
      if (isErr) {
        return {
          checkId: 'SMP-01',
          status: 'fail',
          durationMs,
          message: 'Sampling probe returned isError=true.',
          evidence: { response: { body: raw } },
        }
      }
      return { checkId: 'SMP-01', status: 'pass', durationMs, evidence: { response: { body: raw } } }
    } finally {
      ctx.client.onRequest(null)
    }
  },
}

export default check
