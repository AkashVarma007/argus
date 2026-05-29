import type { Check } from '@/lib/conformance/types'

const ALLOWED = ['forbidden', 'optional', 'required'] as const

const check: Check = {
  id: 'TK-01',
  category: 'tasks',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  requires: ['tools'],
  title: 'execution.taskSupport (if present) is forbidden|optional|required',
  probe: 'Inspect every tool with execution.taskSupport set.',
  criterion: 'Value MUST be one of the three enum constants.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools#tasks',
    section: 'Task support',
    quote: 'execution.taskSupport: "forbidden" | "optional" | "required".',
  },
  deterministic: true,
  async run(ctx) {
    if (!ctx.capabilities?.tools) {
      return { checkId: 'TK-01', status: 'skip', durationMs: 0, message: 'tools capability not declared' }
    }

    const tStart = performance.now()
    const out = await ctx.client.call('tools/list', {})

    if (out.error) {
      return {
        checkId: 'TK-01',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `tools/list failed: ${out.error.message}`,
      }
    }

    const raw = out.raw
    const tools = (out.result as { tools?: unknown })?.tools
    const toolList = Array.isArray(tools) ? tools : []

    const bad: { tool: string; value: unknown }[] = []
    for (const tool of toolList) {
      const v = (tool as { execution?: { taskSupport?: unknown } })?.execution?.taskSupport
      if (v !== undefined && !ALLOWED.includes(v as (typeof ALLOWED)[number])) {
        bad.push({ tool: (tool as { name?: string })?.name ?? '(unknown)', value: v })
      }
    }

    const durationMs = performance.now() - tStart

    if (bad.length === 0) {
      return {
        checkId: 'TK-01',
        status: 'pass',
        durationMs,
        evidence: { response: { body: raw } },
      }
    }

    return {
      checkId: 'TK-01',
      status: 'fail',
      durationMs,
      message: `${bad.length} tool(s) with invalid taskSupport value.`,
      evidence: { actual: bad, expected: 'forbidden|optional|required' },
    }
  },
}

export default check
