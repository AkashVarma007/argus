import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'RC-02',
  category: 'rc',
  severity: 'warning',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1'],
  title: 'serverInfo.icons (if present) is array of { url, sizes? } entries',
  probe: 'Inspect serverInfo.icons for correct shape.',
  criterion: 'icons MUST be an array of objects with string `url` and optional string `sizes`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/draft-2026-v1',
    section: 'serverInfo.icons',
    quote: 'icons: array of { url: string, sizes?: string }.',
  },
  deterministic: true,
  async run(ctx) {
    const tStart = performance.now()
    let init: Awaited<ReturnType<typeof ctx.client.initialize>>
    try {
      init = await ctx.client.initialize()
    } catch (e) {
      return {
        checkId: 'RC-02',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `initialize threw: ${(e as Error).message}`,
      }
    }
    const durationMs = performance.now() - tStart
    const icons = (init.serverInfo as Record<string, unknown> | undefined)?.['icons']
    if (icons === undefined) {
      return {
        checkId: 'RC-02',
        status: 'skip',
        durationMs,
        message: 'No icons declared.',
      }
    }
    if (!Array.isArray(icons)) {
      return {
        checkId: 'RC-02',
        status: 'fail',
        durationMs,
        message: 'icons is not an array.',
        evidence: { actual: typeof icons },
      }
    }
    const bad = icons.filter((i: unknown) => {
      if (typeof i !== 'object' || i === null) return true
      const entry = i as Record<string, unknown>
      return (
        typeof entry.url !== 'string' ||
        ('sizes' in entry && typeof entry.sizes !== 'string')
      )
    })
    if (bad.length === 0) {
      return {
        checkId: 'RC-02',
        status: 'pass',
        durationMs,
        evidence: { response: { body: init } },
      }
    }
    return {
      checkId: 'RC-02',
      status: 'fail',
      durationMs,
      message: `${bad.length} icon entries malformed.`,
      evidence: { actual: bad, expected: '{ url: string, sizes?: string }' },
    }
  },
}

export default check
