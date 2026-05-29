import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'S-04', category: 'security', severity: 'warning', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Non-loopback endpoints use HTTPS',
  probe: 'Inspect endpoint URL: if host is non-loopback, scheme must be https.',
  criterion: 'Public servers MUST use TLS. Loopback (127.0.0.1, ::1, localhost) is exempt.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices',
    section: 'Transport security',
    quote: 'Production deployments MUST use TLS for non-loopback endpoints.',
  },
  deterministic: true,
  async run(ctx) {
    if (ctx.transport.kind !== 'http') {
      return { checkId: 'S-04', status: 'skip', durationMs: 0, message: 'HTTP-only.' }
    }
    const u = new URL(ctx.client.url)
    const loopback = ['127.0.0.1', '::1', 'localhost'].includes(u.hostname)
    if (loopback) {
      return { checkId: 'S-04', status: 'skip', durationMs: 0, message: 'Loopback exempt from TLS requirement.' }
    }
    if (u.protocol === 'https:') {
      return { checkId: 'S-04', status: 'pass', durationMs: 0, evidence: { actual: u.protocol } }
    }
    return {
      checkId: 'S-04', status: 'fail', durationMs: 0,
      message: `Non-loopback endpoint using ${u.protocol} (must be https:).`,
      evidence: { expected: 'https:', actual: u.protocol },
    }
  },
}
export default check
