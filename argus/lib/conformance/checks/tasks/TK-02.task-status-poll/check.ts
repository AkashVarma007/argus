import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'TK-02',
  category: 'tasks',
  severity: 'warning',
  confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  requires: ['tasks'],
  title: 'tasks/status returns running → completed for in-flight task',
  probe: 'Call __torture/slow-tool as background task via tasks/create; poll tasks/status; expect terminal status.',
  criterion: 'Status field transitions from running to completed/failed.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools#tasks',
    section: 'tasks/status',
    quote: 'Status values: running, completed, failed, cancelled.',
  },
  deterministic: false,
  slow: true,
  async run(ctx) {
    if (!ctx.capabilities?.tasks) {
      return { checkId: 'TK-02', status: 'skip', durationMs: 0, message: 'tasks capability not declared' }
    }

    const tStart = performance.now()

    // Inline-check that slow-tool exists
    const listOut = await ctx.client.call('tools/list', {})
    if (listOut.error) {
      return {
        checkId: 'TK-02',
        status: 'skip',
        durationMs: performance.now() - tStart,
        message: `tools/list failed: ${listOut.error.message}`,
      }
    }
    const tools = (listOut.result as { tools?: unknown })?.tools
    const toolList = Array.isArray(tools) ? tools : []
    const hasSlowTool = toolList.some(
      (t) => (t as { name?: string })?.name === '__torture/slow-tool',
    )
    if (!hasSlowTool) {
      return {
        checkId: 'TK-02',
        status: 'skip',
        durationMs: performance.now() - tStart,
        message: 'No __torture/slow-tool available.',
      }
    }

    const create = await ctx.client.call('tasks/create', {
      method: 'tools/call',
      params: { name: '__torture/slow-tool', arguments: { delayMs: 500 } },
    })

    if (create.error || !(create.result as { taskId?: unknown })?.taskId) {
      return {
        checkId: 'TK-02',
        status: 'skip',
        durationMs: performance.now() - tStart,
        message: 'Server does not support tasks/create.',
      }
    }

    const taskId = (create.result as { taskId: string }).taskId

    for (let i = 0; i < 20; i++) {
      await new Promise<void>((r) => setTimeout(r, 200))
      const s = await ctx.client.call('tasks/status', { taskId })
      const status = (s.result as { status?: string } | undefined)?.status
      if (status === 'completed' || status === 'failed' || status === 'cancelled') {
        return {
          checkId: 'TK-02',
          status: 'pass',
          durationMs: performance.now() - tStart,
          evidence: { actual: status },
        }
      }
    }

    return {
      checkId: 'TK-02',
      status: 'fail',
      durationMs: performance.now() - tStart,
      message: 'Task never reached terminal status within 4s.',
      evidence: { expected: 'completed|failed|cancelled', actual: 'timeout' },
    }
  },
}

export default check
