import type { Check } from '../../../types'

const check: Check = {
  id: 'MRTR-01',
  category: 'mrtr',
  severity: 'warning',
  confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1'],
  title: 'Multi-resource transport metadata has expected shape',
  probe: 'If server declares multi-resource transport routing, inspect metadata.',
  criterion: 'mrtr metadata MUST include `resources[]` and `routes[]` arrays.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/draft-2026-v1',
    section: 'Multi-resource transport routing',
    quote: 'MRTR servers expose resources[] and routes[] in their metadata.',
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
          checkId: 'MRTR-01',
          status: 'error',
          durationMs: performance.now() - tStart,
          message: `initialize threw: ${(e as Error).message}`,
        }
      }
    }
    const durationMs = performance.now() - tStart
    const mrtr = (ctx.client.serverInfo as { mrtr?: { resources?: unknown[]; routes?: unknown[] } } | undefined)?.mrtr
    if (!mrtr) {
      return {
        checkId: 'MRTR-01',
        status: 'skip',
        durationMs,
        message: 'No MRTR metadata declared.',
      }
    }
    const ok = Array.isArray(mrtr.resources) && Array.isArray(mrtr.routes)
    if (ok) {
      return {
        checkId: 'MRTR-01',
        status: 'pass',
        durationMs,
        evidence: { response: { body: mrtr } },
      }
    }
    return {
      checkId: 'MRTR-01',
      status: 'fail',
      durationMs,
      message: 'MRTR metadata missing resources[] or routes[].',
      evidence: {
        expected: '{ resources[], routes[] }',
        actual: mrtr,
      },
    }
  },
}

export default check
