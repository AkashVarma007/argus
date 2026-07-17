import { describe, it, expect } from 'vitest'
import { buildTree, type RawDoc } from '../../../scripts/sync-spec/tree'

describe('buildTree', () => {
  it('nests children under parents', () => {
    const docs: RawDoc[] = [
      { slug: 'basic', title: 'Basic', parentSlug: null },
      { slug: 'basic/transports', title: 'Transports', parentSlug: 'basic' },
      { slug: 'basic/lifecycle', title: 'Lifecycle', parentSlug: 'basic' },
    ]
    const tree = buildTree(docs)
    expect(tree.length).toBe(1)
    expect(tree[0].slug).toBe('basic')
    expect(tree[0].children.map((c) => c.slug)).toEqual([
      'basic/lifecycle',
      'basic/transports',
    ])
  })

  it('floats index slugs to the top within each level', () => {
    const docs: RawDoc[] = [
      { slug: 'basic', title: 'Basic', parentSlug: null },
      { slug: 'basic/transports', title: 'Transports', parentSlug: 'basic' },
      { slug: 'basic/index', title: 'Basic Overview', parentSlug: 'basic' },
    ]
    const tree = buildTree(docs)
    expect(tree[0].children[0].slug).toBe('basic/index')
  })

  it('treats orphans as roots', () => {
    const docs: RawDoc[] = [
      { slug: 'unknown', title: 'U', parentSlug: 'missing' },
      { slug: 'root', title: 'R', parentSlug: null },
    ]
    const tree = buildTree(docs)
    expect(tree.map((t) => t.slug).sort()).toEqual(['root', 'unknown'])
  })
})
