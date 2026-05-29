import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'H-02', category: 'hygiene', severity: 'warning', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Same field has same type across responses',
  probe: 'Call tools/list twice; verify each tool entry has identical field types.',
  criterion: 'Field types MUST be stable across repeated calls.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools',
    section: 'Stable typing',
    quote: 'Response shapes SHOULD be consistent across calls.',
  },
  requires: ['tools'],
  deterministic: true,
  async run(ctx) {
    if (!ctx.capabilities?.tools) {
      return { checkId: 'H-02', status: 'skip', durationMs: 0, message: 'tools capability not declared' }
    }

    const tStart = performance.now()
    const a = await ctx.client.call('tools/list', {})
    const b = await ctx.client.call('tools/list', {})
    const durationMs = performance.now() - tStart

    const ta = ((a.result as { tools?: unknown[] } | undefined)?.tools ?? [])[0] as Record<string, unknown> | undefined
    const tb = ((b.result as { tools?: unknown[] } | undefined)?.tools ?? [])[0] as Record<string, unknown> | undefined

    if (!ta || !tb) {
      return { checkId: 'H-02', status: 'skip', durationMs, message: 'No tools to compare.' }
    }

    const drift: string[] = []
    for (const k of Object.keys(ta)) {
      if (typeof ta[k] !== typeof tb[k]) drift.push(`${k}: ${typeof ta[k]} → ${typeof tb[k]}`)
    }

    if (drift.length === 0) {
      return { checkId: 'H-02', status: 'pass', durationMs, evidence: { actual: 'stable' } }
    }
    return {
      checkId: 'H-02', status: 'fail', durationMs,
      message: `Field type drift: ${drift.join(', ')}.`,
      evidence: { actual: drift, expected: 'stable types' },
    }
  },
}
export default check
