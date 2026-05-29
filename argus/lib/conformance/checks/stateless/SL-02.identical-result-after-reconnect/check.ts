import type { Check } from '@/lib/conformance/types'
import { createMcpClient } from '@/lib/conformance/client'
import { createHttpTransport } from '@/lib/conformance/transport/http'

const check: Check = {
  id: 'SL-02',
  category: 'stateless',
  severity: 'warning',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  requires: ['tools'],
  title: 'tools/list result identical when called from a fresh connection',
  probe: 'Call tools/list; tear down client; create fresh client; call tools/list again. Compare results.',
  criterion: 'Tool list MUST NOT depend on prior connection state.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/transports',
    section: 'Statelessness',
    quote: 'Responses to identical requests SHOULD be independent of session history.',
  },
  deterministic: true,
  async run(ctx) {
    if (!ctx.capabilities?.tools) {
      return { checkId: 'SL-02', status: 'skip', durationMs: 0, message: 'tools capability not declared.' }
    }
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'SL-02', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }

    const tStart = performance.now()
    const url = ctx.client.url

    // First call via the existing (already-initialized) client.
    let a: { result?: unknown; error?: unknown }
    try {
      a = await ctx.client.call('tools/list', {})
    } catch (err) {
      return {
        checkId: 'SL-02',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `First tools/list call threw: ${(err as Error).message}`,
      }
    }

    // Create a fresh transport and client, initialize, then call tools/list.
    const freshTransport = createHttpTransport({ kind: 'http', url, protocolVersion: ctx.spec })
    const freshClient = createMcpClient(freshTransport, ctx.spec, url)
    let b: { result?: unknown; error?: unknown }
    try {
      await freshClient.initialize()
      await freshClient.notifyInitialized()
      b = await freshClient.call('tools/list', {})
    } catch (err) {
      return {
        checkId: 'SL-02',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `Fresh tools/list call threw: ${(err as Error).message}`,
      }
    } finally {
      await freshTransport.close()
    }

    const toolsA = (a.result as { tools?: unknown })?.tools
    const toolsB = (b.result as { tools?: unknown })?.tools
    const ja = JSON.stringify(toolsA)
    const jb = JSON.stringify(toolsB)

    if (ja === jb) {
      return {
        checkId: 'SL-02',
        status: 'pass',
        durationMs: performance.now() - tStart,
        evidence: {
          response: { body: toolsA },
          actual: 'identical',
        },
      }
    }

    return {
      checkId: 'SL-02',
      status: 'fail',
      durationMs: performance.now() - tStart,
      message: 'tools/list differed between original and fresh connection.',
      evidence: {
        expected: 'identical results',
        actual: { first: ja.slice(0, 200), second: jb.slice(0, 200) },
      },
    }
  },
}

export default check
