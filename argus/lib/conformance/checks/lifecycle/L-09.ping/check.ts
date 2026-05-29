import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'L-09',
  category: 'lifecycle',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  deterministic: true,
  title: 'ping succeeds both pre-init and post-init',
  probe: 'Call ping before initialize and again after; both succeed.',
  criterion: 'ping MUST work in any lifecycle state.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/lifecycle',
    section: 'Utility messages',
    quote: 'ping is a utility message that can be sent at any time.',
  },
  async run(ctx) {
    const tStart = performance.now()
    const pre = await ctx.client.call('ping', {})
    if (pre.error) {
      const durationMs = performance.now() - tStart
      return {
        checkId: 'L-09',
        status: 'fail',
        durationMs,
        message: `Pre-init ping failed: ${pre.error.code} ${pre.error.message}`,
        evidence: {
          response: { body: pre.error },
          actual: pre.error,
        },
      }
    }
    await ctx.client.initialize()
    const post = await ctx.client.call('ping', {})
    const durationMs = performance.now() - tStart
    if (post.error) {
      return {
        checkId: 'L-09',
        status: 'fail',
        durationMs,
        message: `Post-init ping failed: ${post.error.code} ${post.error.message}`,
        evidence: {
          response: { body: post.error },
          actual: post.error,
        },
      }
    }
    return {
      checkId: 'L-09',
      status: 'pass',
      durationMs,
      evidence: {
        actual: { pre: pre.result, post: post.result },
      },
    }
  },
}

export default check
