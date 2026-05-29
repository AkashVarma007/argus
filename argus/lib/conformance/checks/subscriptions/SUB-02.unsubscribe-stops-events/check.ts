import type { Check } from '../../../types'
import type { JsonRpcNotification } from '../../../helpers/jsonrpc'

const check: Check = {
  id: 'SUB-02',
  category: 'subscriptions',
  severity: 'warning',
  confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'resources/unsubscribe stops further notifications',
  probe: 'Subscribe → unsubscribe → trigger update → expect no notification.',
  criterion: 'After unsubscribe, server MUST NOT emit further notifications for that resource.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/resources',
    section: 'resources/unsubscribe',
    quote: 'After unsubscribe, no further notifications/resources/updated SHALL be sent.',
  },
  requires: ['resources'],
  deterministic: false,
  async run(ctx) {
    const tStart = performance.now()
    const uri = 'argus://torture/dynamic'

    try {
      const sub = await ctx.client.call('resources/subscribe', { uri })
      if (sub.error) {
        return {
          checkId: 'SUB-02',
          status: 'skip',
          durationMs: performance.now() - tStart,
          message: 'Server does not support subscribe.',
        }
      }

      const unsub = await ctx.client.call('resources/unsubscribe', { uri })
      if (unsub.error) {
        return {
          checkId: 'SUB-02',
          status: 'skip',
          durationMs: performance.now() - tStart,
          message: 'unsubscribe not supported.',
        }
      }

      const after: Array<{ method: string; params?: { uri?: string } }> = []
      ctx.client.onNotification((n: JsonRpcNotification) => {
        if (n.method === 'notifications/resources/updated' && (n.params as { uri?: string } | undefined)?.uri === uri) {
          after.push(n as { method: string; params?: { uri?: string } })
        }
      })

      await ctx.client.call('tools/call', { name: '__torture/touch-resource', arguments: { uri } })
      await new Promise<void>((r) => setTimeout(r, 500))

      const durationMs = performance.now() - tStart
      if (after.length === 0) {
        return {
          checkId: 'SUB-02',
          status: 'pass',
          durationMs,
          evidence: { actual: 'silenced' },
        }
      }
      return {
        checkId: 'SUB-02',
        status: 'fail',
        durationMs,
        message: `Received ${after.length} notification(s) after unsubscribe.`,
        evidence: { expected: 0, actual: after.length },
      }
    } catch (err: unknown) {
      return {
        checkId: 'SUB-02',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `SUB-02 probe threw: ${err instanceof Error ? err.message : String(err)}`,
      }
    } finally {
      ctx.client.onNotification(null)
    }
  },
}

export default check
