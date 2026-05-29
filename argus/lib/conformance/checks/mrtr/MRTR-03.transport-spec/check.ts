import type { Check } from '../../../types'

const ALLOWED = ['http', 'sse', 'stdio'] as const

const check: Check = {
  id: 'MRTR-03',
  category: 'mrtr',
  severity: 'warning',
  confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1'],
  title: 'MRTR routes use only allowed transport identifiers',
  probe: 'Inspect each route.transport for allowed values.',
  criterion: 'Each route.transport MUST be `http`, `sse`, or `stdio`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/draft-2026-v1',
    section: 'MRTR routes',
    quote: 'route.transport: http | sse | stdio.',
  },
  deterministic: true,
  async run(ctx) {
    const tStart = performance.now()
    // Use the already-populated serverInfo from the client if available; only
    // call initialize() once if it hasn't been called yet (fresh test harness).
    // Never call initialize() a second time — strict servers reject duplicate initialize.
    if (!ctx.client.serverInfo) {
      try {
        await ctx.client.initialize()
      } catch (e) {
        return {
          checkId: 'MRTR-03',
          status: 'error',
          durationMs: performance.now() - tStart,
          message: `initialize threw: ${(e as Error).message}`,
        }
      }
    }
    const durationMs = performance.now() - tStart
    const mrtr = (ctx.client.serverInfo as { mrtr?: { resources?: unknown[]; routes?: unknown[] } } | undefined)?.mrtr
    if (!Array.isArray(mrtr?.routes)) {
      return {
        checkId: 'MRTR-03',
        status: 'skip',
        durationMs,
        message: 'No MRTR routes.',
      }
    }
    const bad = (mrtr.routes as Array<{ transport?: unknown }>).filter(
      (r) => !ALLOWED.includes(r?.transport as (typeof ALLOWED)[number]),
    )
    if (bad.length === 0) {
      return {
        checkId: 'MRTR-03',
        status: 'pass',
        durationMs,
        evidence: { response: { body: mrtr.routes } },
      }
    }
    return {
      checkId: 'MRTR-03',
      status: 'fail',
      durationMs,
      message: `${bad.length} route(s) with disallowed transport.`,
      evidence: {
        actual: bad,
        expected: ALLOWED.join('|'),
      },
    }
  },
}

export default check
