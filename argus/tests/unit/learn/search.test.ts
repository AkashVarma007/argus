import { describe, it, expect, beforeEach } from 'vitest'
import { searchSpec, _resetSearchCache } from '@/lib/learn/search'
import type { SpecIndex } from '@/lib/learn/types'

const index: SpecIndex = {
  version: 'draft-2026-v1',
  generatedAt: '2026-05-29T00:00:00.000Z',
  tree: [],
  entries: [
    {
      slug: 'basic/transports',
      title: 'Transports',
      excerpt: 'Streaming HTTP and stdio transports for MCP.',
      parentSlug: 'basic',
      anchors: [{ id: 'streaming-http', text: 'Streaming HTTP', level: 2 }],
    },
    {
      slug: 'basic/lifecycle',
      title: 'Lifecycle',
      excerpt: 'Initialization and shutdown sequence.',
      parentSlug: 'basic',
      anchors: [{ id: 'initialization', text: 'Initialization', level: 2 }],
    },
    {
      slug: 'server/tools',
      title: 'Tools',
      excerpt: 'Tool listing and invocation.',
      parentSlug: 'server',
      anchors: [],
    },
  ],
}

beforeEach(() => {
  _resetSearchCache()
})

describe('searchSpec', () => {
  it('returns title match first', () => {
    const hits = searchSpec(index, 'transports')
    expect(hits[0].slug).toBe('basic/transports')
  })

  it('returns excerpt match when title does not hit', () => {
    const hits = searchSpec(index, 'shutdown')
    expect(hits[0].slug).toBe('basic/lifecycle')
  })

  it('returns empty array on empty query', () => {
    expect(searchSpec(index, '')).toEqual([])
    expect(searchSpec(index, '   ')).toEqual([])
  })

  it('exposes matched anchor when relevant', () => {
    const hits = searchSpec(index, 'streaming')
    expect(hits[0].matchedAnchor?.id).toBe('streaming-http')
  })
})
