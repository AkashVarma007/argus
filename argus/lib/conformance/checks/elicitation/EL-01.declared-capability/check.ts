import type { Check } from '@/lib/conformance/types'
import type { JsonRpcRequest } from '@/lib/conformance/helpers/jsonrpc'

const check: Check = {
  id: 'EL-01',
  category: 'elicitation',
  severity: 'warning',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Server invokes elicitation/create only when client declared elicitation',
  probe: 'Call __torture/elicitation-probe tool; Argus responds to back-request; verify full round-trip succeeds.',
  criterion: 'Servers MUST only issue elicitation/create if the client declared the elicitation capability.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/client/elicitation',
    section: 'Capability requirement',
    quote: 'Servers MUST only issue elicitation requests if the client declared the elicitation capability.',
  },
  deterministic: true,
  async run(ctx) {
    const tStart = performance.now()
    const list = await ctx.client.call('tools/list', {})
    if (list.error) {
      return {
        checkId: 'EL-01',
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
        checkId: 'EL-01',
        status: 'skip',
        durationMs: performance.now() - tStart,
        message: 'No __torture/elicitation-probe tool available.',
      }
    }

    // Respond to the back-request with a stub elicitation result so the probe can succeed.
    ctx.client.onRequest((req: JsonRpcRequest) => {
      if (req.method === 'elicitation/create') {
        return { action: 'accept', content: { field: 'stub-value' } }
      }
      return {}
    })

    try {
      const { result, error, raw } = await ctx.client.call('tools/call', {
        name: '__torture/elicitation-probe',
        arguments: {},
      })
      const durationMs = performance.now() - tStart
      if (error) {
        return {
          checkId: 'EL-01',
          status: 'fail',
          durationMs,
          message: `Server failed elicitation probe even though client declared elicitation: ${error.message}`,
          evidence: { response: { body: raw } },
        }
      }
      const isErr = (result as Record<string, unknown> | undefined)?.isError === true
      if (isErr) {
        return {
          checkId: 'EL-01',
          status: 'fail',
          durationMs,
          message: 'Elicitation probe returned isError=true.',
          evidence: { response: { body: raw } },
        }
      }
      return { checkId: 'EL-01', status: 'pass', durationMs, evidence: { response: { body: raw } } }
    } finally {
      ctx.client.onRequest(null)
    }
  },
}

export default check
