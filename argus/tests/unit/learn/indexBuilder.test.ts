import { describe, it, expect } from 'vitest'
import { buildSpecIndex } from '../../../scripts/sync-spec/index'
import type { SpecIndexEntry, SpecNode } from '@/lib/learn/types'

describe('buildSpecIndex', () => {
  const entries: SpecIndexEntry[] = [
    { slug: 'a', title: 'A', excerpt: '', anchors: [], parentSlug: null },
  ]
  const tree: SpecNode[] = [
    { slug: 'a', title: 'A', parentSlug: null, children: [] },
  ]

  it('stamps version and generatedAt', () => {
    const out = buildSpecIndex({ entries, tree, now: () => new Date('2026-05-29T00:00:00Z') })
    expect(out.version).toBe('draft-2026-v1')
    expect(out.generatedAt).toBe('2026-05-29T00:00:00.000Z')
  })

  it('passes through entries and tree', () => {
    const out = buildSpecIndex({ entries, tree })
    expect(out.entries).toBe(entries)
    expect(out.tree).toBe(tree)
  })
})
