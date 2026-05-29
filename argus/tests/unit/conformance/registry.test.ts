import { describe, it, expect } from 'vitest'
import { listChecks, getCheck, byCategory } from '@/lib/conformance/registry'

describe('check registry', () => {
  it('listChecks returns at least the categories declared in registry.ts', () => {
    const ids = listChecks().map((c) => c.id)
    expect(ids.length).toBeGreaterThan(0)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('byCategory groups checks under their declared category key', () => {
    const groups = byCategory()
    for (const [cat, group] of Object.entries(groups)) {
      for (const c of group) expect(c.category).toBe(cat)
    }
  })

  it('getCheck returns undefined for an unknown id', () => {
    expect(getCheck('XYZ-999')).toBeUndefined()
  })
})
