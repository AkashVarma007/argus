// argus/tests/unit/conformance/adapter.test.ts
import { describe, it, expect } from 'vitest'
import { toStoreResult } from '@/lib/conformance/adapter'
import type { CheckResult as EngineCheckResult, Check } from '@/lib/conformance/types'

const engineCheck: Check = {
  id: 'T-07', category: 'transport', severity: 'error', confidence: 'high',
  appliesTo: ['DRAFT-2026-v1'], title: 'Origin validation', probe: '', criterion: '',
  specRef: { url: 'https://x', section: 's', quote: 'q' },
  deterministic: true, async run() { throw new Error('n/a') },
}

const engineResult: EngineCheckResult = {
  checkId: 'T-07', status: 'fail', durationMs: 12,
  message: 'Server accepted disallowed Origin',
  evidence: { expected: '403', actual: { status: 200 } },
}

describe('toStoreResult', () => {
  it('maps engine severity error → major', () => {
    const r = toStoreResult(engineResult, engineCheck)
    expect(r.severity).toBe('major')
  })
  it('carries observed/expected/specRef/fixHint into store shape', () => {
    const r = toStoreResult(engineResult, engineCheck)
    expect(r.observed).toContain('200')
    expect(r.expected).toBe('403')
    expect(r.specRef).toBe('https://x')
  })
  it('preserves pass and durationMs', () => {
    const r = toStoreResult({ ...engineResult, status: 'pass', durationMs: 5 }, engineCheck)
    expect(r.status).toBe('pass')
    expect(r.durationMs).toBe(5)
  })

  it('maps engine severity info → info', () => {
    const infoCheck: Check = { ...engineCheck, severity: 'info' }
    const r = toStoreResult(engineResult, infoCheck)
    expect(r.severity).toBe('info')
  })

  it('joins evidence.notes into fixHint', () => {
    const r = toStoreResult(
      { ...engineResult, evidence: { ...engineResult.evidence, notes: ['try X', 'try Y'] } },
      engineCheck,
    )
    expect(r.fixHint).toBe('try X; try Y')
  })

  it('returns undefined fixHint when notes is empty array', () => {
    const r = toStoreResult(
      { ...engineResult, evidence: { ...engineResult.evidence, notes: [] } },
      engineCheck,
    )
    expect(r.fixHint).toBeUndefined()
  })

  it('stringifies numeric actual values', () => {
    const r = toStoreResult(
      { ...engineResult, evidence: { actual: 42 } },
      engineCheck,
    )
    expect(r.observed).toBe('42')
  })
})
