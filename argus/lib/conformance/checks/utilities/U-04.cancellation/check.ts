import type { Check } from '@/lib/conformance/types'

// How long to wait before sending cancellation (ms).
const CANCEL_AFTER_MS = 200
// Total budget; if the call is still in-flight after this, fail.
const TIMEOUT_MS = 2500

const check: Check = {
  id: 'U-04',
  category: 'utilities',
  severity: 'warning',
  confidence: 'medium',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Server honours notifications/cancelled and terminates early',
  probe: 'Call __torture/slow-tool with long delay; after 200ms send notifications/cancelled; verify call resolves within 2500ms total.',
  criterion: 'When the client sends notifications/cancelled for an in-flight request, the server SHOULD terminate that request promptly.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/basic/utilities/cancellation',
    section: 'Cancellation',
    quote: 'Upon receiving notifications/cancelled, servers SHOULD terminate the in-flight request as soon as possible.',
  },
  deterministic: false,
  slow: true,
  async run(ctx) {
    const tStart = performance.now()

    const list = await ctx.client.call('tools/list', {})
    if (list.error) {
      return {
        checkId: 'U-04',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `tools/list returned error ${list.error.code}: ${list.error.message}`,
        evidence: { response: { body: list.error } },
      }
    }
    const rawTools = (list.result as { tools?: unknown })?.tools
    const tools: unknown[] = Array.isArray(rawTools) ? rawTools : []
    const probe = tools.find((t) => (t as Record<string, unknown>)?.name === '__torture/slow-tool')
    if (!probe) {
      return {
        checkId: 'U-04',
        status: 'skip',
        durationMs: performance.now() - tStart,
        message: 'No __torture/slow-tool available.',
      }
    }

    // Obtain the id ahead of the call so we can send cancellation referencing it.
    const callId = ctx.client.nextRequestId()

    // Use a delay longer than TIMEOUT_MS so violations (which ignore cancel) time out.
    const callPromise = ctx.client.callWithId(callId, 'tools/call', {
      name: '__torture/slow-tool',
      arguments: { delayMs: 3000 },
    })

    // After CANCEL_AFTER_MS, send the cancellation notification.
    const cancelTimer = setTimeout(() => {
      void ctx.client.notify('notifications/cancelled', { requestId: callId })
    }, CANCEL_AFTER_MS)

    // Race the call against a hard timeout.
    let timedOut = false
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        timedOut = true
        reject(new Error(`call did not resolve within ${TIMEOUT_MS}ms`))
      }, TIMEOUT_MS)
    })

    let outcome: string
    try {
      await Promise.race([callPromise, timeoutPromise])
      outcome = 'resolved'
    } catch {
      outcome = timedOut ? 'timeout' : 'error'
    } finally {
      clearTimeout(cancelTimer)
      if (timeoutHandle) clearTimeout(timeoutHandle)
    }

    const durationMs = performance.now() - tStart

    if (outcome === 'timeout') {
      return {
        checkId: 'U-04',
        status: 'fail',
        durationMs,
        message: `Call did not resolve within ${TIMEOUT_MS}ms after cancellation was sent.`,
        evidence: {
          actual: outcome,
          expected: `cancelled or completed in <${TIMEOUT_MS}ms`,
        },
      }
    }

    if (outcome === 'error') {
      return {
        checkId: 'U-04',
        status: 'error',
        durationMs,
        message: 'tools/call threw unexpectedly during cancellation probe.',
        evidence: {
          actual: outcome,
          expected: `cancelled or completed in <${TIMEOUT_MS}ms`,
        },
      }
    }

    return {
      checkId: 'U-04',
      status: 'pass',
      durationMs,
      evidence: {
        actual: outcome,
        expected: `cancelled or completed in <${TIMEOUT_MS}ms`,
      },
    }
  },
}

export default check
