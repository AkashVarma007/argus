import type { Check } from '@/lib/conformance/types'

const STACK_RE = /\\n\s*at\s+|\n\s+at\s+|Traceback \(most recent|panic:\s+|goroutine \d+ \[/

const check: Check = {
  id: 'H-08', category: 'hygiene', severity: 'warning', confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Error messages do not leak stack traces',
  probe: 'Trigger known error paths and grep error.message for stack-trace patterns.',
  criterion: 'Production errors SHOULD NOT include raw stack traces (info disclosure risk).',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices',
    section: 'Information disclosure',
    quote: 'Servers SHOULD NOT expose internal stack traces or paths in error messages.',
  },
  deterministic: true,
  async run(ctx) {
    const tStart = performance.now()
    const probes = [
      () => ctx.client.call('nonexistent/method', {}),
      () => ctx.client.call('tools/call', { name: '__torture/throw', arguments: {} }),
    ]
    const leaks: string[] = []
    for (const p of probes) {
      const { error, result } = await p()
      const text = JSON.stringify({ error, result })
      if (STACK_RE.test(text)) leaks.push(text.slice(0, 200))
    }
    const durationMs = performance.now() - tStart
    if (leaks.length === 0) {
      return { checkId: 'H-08', status: 'pass', durationMs, evidence: { actual: 'clean' } }
    }
    return {
      checkId: 'H-08', status: 'fail', durationMs,
      message: `Stack trace leaked in ${leaks.length} response(s).`,
      evidence: { actual: leaks },
    }
  },
}
export default check
