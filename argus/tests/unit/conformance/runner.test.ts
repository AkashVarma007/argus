import { describe, it, expect } from 'vitest'
import { runScan } from '@/lib/conformance/runner'
import type { Check, CheckContext } from '@/lib/conformance/types'

function mkCheck(partial: Partial<Check>): Check {
  return {
    id: partial.id ?? 'X-01',
    category: partial.category ?? 'transport',
    severity: partial.severity ?? 'error',
    confidence: 'high',
    appliesTo: partial.appliesTo ?? ['2025-11-25', 'DRAFT-2026-v1'],
    title: 't',
    probe: 'p',
    criterion: 'c',
    specRef: { url: 'http://example.com', section: '§', quote: 'q' },
    deterministic: true,
    requires: partial.requires,
    run: partial.run ?? (async () => ({ checkId: partial.id ?? 'X-01', status: 'pass', durationMs: 1 })),
  }
}

const fakeCtx = (caps: Record<string, unknown> = {}) => ({
  capabilities: caps,
  spec: '2025-11-25' as const,
  serverInfo: { protocolVersion: '2025-11-25', capabilities: {}, serverInfo: { name: 'x', version: '1' } },
}) as unknown as CheckContext

describe('runScan', () => {
  it('runs every applicable check and streams progress events', async () => {
    const events: { id: string; status: string }[] = []
    const checks = [mkCheck({ id: 'A' }), mkCheck({ id: 'B', severity: 'warning' })]
    const result = await runScan(checks, fakeCtx(), {
      onProgress: (id, status) => events.push({ id, status }),
    })
    expect(result.results.length).toBe(2)
    expect(events).toEqual([
      { id: 'A', status: 'start' }, { id: 'A', status: 'pass' },
      { id: 'B', status: 'start' }, { id: 'B', status: 'pass' },
    ])
  })

  it('skips checks whose appliesTo excludes the active spec', async () => {
    const c = mkCheck({ id: 'X', appliesTo: ['DRAFT-2026-v1'] })
    const result = await runScan([c], fakeCtx())
    expect(result.results[0].status).toBe('skip')
  })

  it('skips checks whose requires capability is missing', async () => {
    const c = mkCheck({ id: 'Y', requires: ['tools'] })
    const result = await runScan([c], fakeCtx({}))
    expect(result.results[0].status).toBe('skip')
  })

  it('catches exceptions and emits status=error', async () => {
    const c = mkCheck({
      id: 'Z',
      run: async () => { throw new Error('boom') },
    })
    const result = await runScan([c], fakeCtx())
    expect(result.results[0].status).toBe('error')
    expect(result.results[0].message).toMatch(/boom/)
  })

  it('aborts when AbortSignal fires; remaining checks are skipped', async () => {
    const c1 = mkCheck({ id: 'A' })
    const c2 = mkCheck({ id: 'B' })
    const controller = new AbortController()
    const promise = runScan([c1, c2], fakeCtx(), {
      signal: controller.signal,
      onProgress: (id, status) => { if (id === 'A' && status === 'pass') controller.abort() },
    })
    const result = await promise
    expect(result.results.find((r) => r.checkId === 'B')?.status).toBe('skip')
  })
})
