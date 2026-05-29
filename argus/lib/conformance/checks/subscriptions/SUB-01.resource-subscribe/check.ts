import type { Check } from '../../../types'
import type { JsonRpcNotification } from '../../../helpers/jsonrpc'

const check: Check = {
  id: 'SUB-01',
  category: 'subscriptions',
  severity: 'warning',
  confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'resources/subscribe yields notifications/resources/updated',
  probe: 'Subscribe to __torture/resource; trigger update; expect notification.',
  criterion: 'After resources/subscribe, server MUST emit notifications/resources/updated on change.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/resources',
    section: 'resources/subscribe',
    quote: 'After subscription, the server emits notifications/resources/updated when the resource changes.',
  },
  requires: ['resources'],
  deterministic: false,
  async run(ctx) {
    const tStart = performance.now()
    const uri = 'argus://torture/dynamic'
    const events: Array<{ method: string; params?: { uri?: string } }> = []

    ctx.client.onNotification((n: JsonRpcNotification) => {
      if (n.method === 'notifications/resources/updated' && (n.params as { uri?: string } | undefined)?.uri === uri) {
        events.push(n as { method: string; params?: { uri?: string } })
      }
    })

    try {
      const sub = await ctx.client.call('resources/subscribe', { uri })
      if (sub.error) {
        return {
          checkId: 'SUB-01',
          status: 'skip',
          durationMs: performance.now() - tStart,
          message: 'Server does not support subscribe.',
        }
      }

      await ctx.client.call('tools/call', { name: '__torture/touch-resource', arguments: { uri } })
      await new Promise<void>((r) => setTimeout(r, 500))

      const durationMs = performance.now() - tStart
      if (events.length > 0) {
        return {
          checkId: 'SUB-01',
          status: 'pass',
          durationMs,
          evidence: { actual: `${events.length} updates` },
        }
      }
      return {
        checkId: 'SUB-01',
        status: 'fail',
        durationMs,
        message: 'No resources/updated notification observed within 500ms.',
        evidence: { expected: '≥1 update', actual: 0 },
      }
    } catch (err: unknown) {
      return {
        checkId: 'SUB-01',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `SUB-01 probe threw: ${err instanceof Error ? err.message : String(err)}`,
      }
    } finally {
      ctx.client.onNotification(null)
    }
  },
}

export default check
