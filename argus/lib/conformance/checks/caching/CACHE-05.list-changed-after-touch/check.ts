import type { Check } from '../../../types'
import type { JsonRpcNotification } from '../../../helpers/jsonrpc'

const check: Check = {
  id: 'CACHE-05',
  category: 'caching',
  severity: 'warning',
  confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'After __torture/touch-tools, notifications/tools/list_changed fires',
  probe: 'Subscribe to list_changed notifications; call __torture/touch-tools; expect notification.',
  criterion: 'When tool set changes, server MUST emit notifications/tools/list_changed.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'list_changed',
    quote: 'On tool list change, server emits notifications/tools/list_changed.',
  },
  requires: ['tools'],
  deterministic: false,
  async run(ctx) {
    const tStart = performance.now()
    const events: JsonRpcNotification[] = []

    ctx.client.onNotification((n: JsonRpcNotification) => {
      if (n.method === 'notifications/tools/list_changed') events.push(n)
    })

    try {
      const touch = await ctx.client.call('tools/call', { name: '__torture/touch-tools', arguments: {} })
      if (touch.error) {
        return {
          checkId: 'CACHE-05',
          status: 'skip',
          durationMs: performance.now() - tStart,
          message: 'No touch-tools probe.',
        }
      }
      await new Promise<void>((r) => setTimeout(r, 500))
      const durationMs = performance.now() - tStart
      if (events.length > 0) {
        return {
          checkId: 'CACHE-05',
          status: 'pass',
          durationMs,
          evidence: { actual: events.length },
        }
      }
      return {
        checkId: 'CACHE-05',
        status: 'fail',
        durationMs,
        message: 'No list_changed notification after tool set mutation.',
        evidence: { expected: '≥1 list_changed', actual: 0 },
      }
    } catch (err: unknown) {
      return {
        checkId: 'CACHE-05',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `CACHE-05 probe threw: ${err instanceof Error ? err.message : String(err)}`,
      }
    } finally {
      ctx.client.onNotification(null)
    }
  },
}

export default check
