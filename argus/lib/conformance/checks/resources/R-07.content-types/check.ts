import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'R-07',
  category: 'resources',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Resource contents use text XOR blob, with mimeType',
  probe: 'Read first listed resource; verify contents shape.',
  criterion: 'Each content entry MUST have either `text` (string) or `blob` (base64 string), plus `mimeType`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/resources',
    section: 'Resource contents',
    quote: 'Each content item has either text or blob, plus the mimeType.',
  },
  requires: ['resources'],
  deterministic: true,
  async run(ctx) {
    if (!ctx.capabilities?.resources) {
      return { checkId: 'R-07', status: 'skip', durationMs: 0, message: 'resources capability not declared' }
    }
    const tStart = performance.now()
    const listCall = await ctx.client.call('resources/list', {})
    if (listCall.error) {
      return {
        checkId: 'R-07',
        status: 'error',
        durationMs: performance.now() - tStart,
        message: `resources/list returned error ${listCall.error.code}: ${listCall.error.message}`,
        evidence: { response: { body: listCall.error } },
      }
    }
    const rawResources = (listCall.result as { resources?: unknown })?.resources
    if (!Array.isArray(rawResources) || rawResources.length === 0) {
      return { checkId: 'R-07', status: 'skip', durationMs: performance.now() - tStart, message: 'No resources to read.' }
    }
    const first = rawResources[0] as Record<string, unknown>
    if (typeof first.uri !== 'string') {
      return {
        checkId: 'R-07',
        status: 'fail',
        durationMs: performance.now() - tStart,
        message: 'First resource has non-string uri; cannot read contents.',
        evidence: { response: { body: listCall.result }, expected: 'string uri', actual: first },
      }
    }
    const { result, error } = await ctx.client.call('resources/read', { uri: first.uri })
    const durationMs = performance.now() - tStart
    if (error) {
      return {
        checkId: 'R-07',
        status: 'error',
        durationMs,
        message: `resources/read returned error ${error.code}: ${error.message}`,
        evidence: { response: { body: error } },
      }
    }
    const rawContents = (result as { contents?: unknown })?.contents
    if (!Array.isArray(rawContents)) {
      return {
        checkId: 'R-07',
        status: 'fail',
        durationMs,
        message: 'resources/read did not return a contents array',
        evidence: { response: { body: result }, expected: '{ contents: [...] }', actual: result },
      }
    }
    const contents: unknown[] = rawContents
    if (contents.length === 0) {
      return { checkId: 'R-07', status: 'skip', durationMs, message: 'No resource contents to inspect.' }
    }
    const bad: unknown[] = []
    for (const c of contents) {
      const item = c as Record<string, unknown>
      const hasText = typeof item?.text === 'string'
      const hasBlob = typeof item?.blob === 'string'
      const hasMime = typeof item?.mimeType === 'string'
      if (!hasMime || hasText === hasBlob) {
        bad.push(item)
      }
    }
    if (bad.length === 0) {
      return { checkId: 'R-07', status: 'pass', durationMs, evidence: { response: { body: result } } }
    }
    return {
      checkId: 'R-07',
      status: 'fail',
      durationMs,
      message: `Resource contents shape invalid (${bad.length} of ${contents.length} bad).`,
      evidence: {
        response: { body: result },
        actual: bad,
        expected: '{ text|blob, mimeType }',
      },
    }
  },
}

export default check
