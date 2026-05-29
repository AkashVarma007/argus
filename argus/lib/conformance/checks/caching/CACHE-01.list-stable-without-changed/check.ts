import type { Check } from '../../../types'
import type { CallOutcome } from '../../../client'

const check: Check = {
  id: 'CACHE-01',
  category: 'caching',
  severity: 'warning',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'tools/list result is byte-stable when no listChanged event',
  probe: 'Call tools/list twice quickly; verify identical JSON-stringified result.',
  criterion: 'In the absence of list_changed notifications, tools/list responses MUST be identical.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'Caching guidance',
    quote: 'Clients may cache tools/list until receiving notifications/tools/list_changed.',
  },
  requires: ['tools'],
  deterministic: true,
  async run(ctx) {
    const tStart = performance.now()
    let a: CallOutcome
    let b: CallOutcome
    try {
      a = await ctx.client.call('tools/list', {})
      b = await ctx.client.call('tools/list', {})
    } catch (err: unknown) {
      return {
        checkId: 'CACHE-01',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `CACHE-01 probe threw: ${err instanceof Error ? err.message : String(err)}`,
      }
    }
    const durationMs = performance.now() - tStart
    if (a.error || b.error) {
      return {
        checkId: 'CACHE-01',
        status: 'error',
        durationMs,
        message: `tools/list returned error: ${(a.error ?? b.error)?.message ?? 'unknown'}`,
        evidence: { actual: { firstError: a.error, secondError: b.error } },
      }
    }
    if (JSON.stringify(a.result) === JSON.stringify(b.result)) {
      return {
        checkId: 'CACHE-01',
        status: 'pass',
        durationMs,
        evidence: { actual: 'stable' },
      }
    }
    return {
      checkId: 'CACHE-01',
      status: 'fail',
      durationMs,
      message: 'tools/list differed between consecutive calls.',
      evidence: {
        expected: 'identical',
        actual: { first: a.result, second: b.result },
      },
    }
  },
}

export default check
