import type { Check } from '@/lib/conformance/types'

const check: Check = {
  id: 'R-01',
  category: 'resources',
  severity: 'error',
  confidence: 'high',
  appliesTo: ['DRAFT-2026-v1', '2025-11-25'],
  title: 'Every resource has uri and name',
  probe: 'List resources; inspect required fields.',
  criterion: 'Each resource MUST have string `uri` and string `name`.',
  specRef: {
    url: 'https://modelcontextprotocol.io/specification/2025-11-25/server/resources',
    section: 'Resource definition',
    quote: 'Each resource has a uri and a human-readable name.',
  },
  requires: ['resources'],
  deterministic: true,
  async run(ctx) {
    if (!ctx.capabilities?.resources) {
      return { checkId: 'R-01', status: 'skip', durationMs: 0, message: 'resources capability not declared' }
    }
    const tStart = performance.now()
    const { result, error } = await ctx.client.call('resources/list', {})
    const durationMs = performance.now() - tStart
    if (error) {
      return {
        checkId: 'R-01',
        status: 'error',
        durationMs,
        message: `resources/list returned error ${error.code}: ${error.message}`,
        evidence: { response: { body: error } },
      }
    }
    const rawResources = (result as { resources?: unknown })?.resources
    if (!Array.isArray(rawResources)) {
      return {
        checkId: 'R-01',
        status: 'fail',
        durationMs,
        message: 'resources/list did not return a resources array',
        evidence: { response: { body: result }, expected: '{ resources: [...] }', actual: result },
      }
    }
    const resources: unknown[] = rawResources
    const bad: { uri: string; issues: string[] }[] = []
    for (const r of resources) {
      const resource = r as Record<string, unknown>
      const issues: string[] = []
      if (typeof resource?.uri !== 'string') issues.push('uri not string')
      if (typeof resource?.name !== 'string') issues.push('name not string')
      if (issues.length) {
        bad.push({ uri: typeof resource?.uri === 'string' ? resource.uri : '(unknown)', issues })
      }
    }
    if (bad.length === 0) {
      return { checkId: 'R-01', status: 'pass', durationMs, evidence: { response: { body: result } } }
    }
    return {
      checkId: 'R-01',
      status: 'fail',
      durationMs,
      message: `${bad.length} resource(s) missing required string uri/name.`,
      evidence: {
        response: { body: result },
        actual: bad,
        expected: '{ uri: string, name: string }',
      },
    }
  },
}

export default check
