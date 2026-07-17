import { describe, it, expect } from 'vitest'
import { parseSpecScheme, resolveSpecHref } from '@/lib/learn/href'
import type { SpecIndex } from '@/lib/learn/types'

const index: SpecIndex = {
  version: 'draft-2026-v1',
  generatedAt: '2026-05-29T00:00:00.000Z',
  tree: [],
  entries: [
    {
      slug: 'basic/transports',
      title: 'Transports',
      excerpt: '',
      parentSlug: 'basic',
      anchors: [
        { id: 'streaming-http', text: 'Streaming HTTP', level: 2 },
        { id: '7-4', text: '7.4', level: 3 },
      ],
    },
    {
      slug: 'basic/lifecycle',
      title: 'Lifecycle',
      excerpt: '',
      parentSlug: 'basic',
      anchors: [{ id: 'initialization', text: 'Initialization', level: 2 }],
    },
  ],
}

describe('parseSpecScheme', () => {
  it('parses slug and anchor', () => {
    expect(parseSpecScheme('spec://basic/transports#streaming-http')).toEqual({
      slug: 'basic/transports',
      anchor: 'streaming-http',
    })
  })

  it('parses slug only', () => {
    expect(parseSpecScheme('spec://basic/lifecycle')).toEqual({
      slug: 'basic/lifecycle',
      anchor: null,
    })
  })

  it('returns null on missing scheme', () => {
    expect(parseSpecScheme('basic/transports')).toBeNull()
  })

  it('returns null on empty body', () => {
    expect(parseSpecScheme('spec://')).toBeNull()
  })
})

describe('resolveSpecHref', () => {
  it('resolves direct slug', () => {
    expect(resolveSpecHref('spec://basic/lifecycle', index)).toBe('/learn/basic/lifecycle')
  })

  it('resolves slug + anchor', () => {
    expect(
      resolveSpecHref('spec://basic/transports#streaming-http', index),
    ).toBe('/learn/basic/transports?pulse=streaming-http#streaming-http')
  })

  it('falls back to anchor scan for numeric ref', () => {
    expect(resolveSpecHref('spec://7-4', index)).toBe(
      '/learn/basic/transports?pulse=7-4#7-4',
    )
  })

  it('returns null on unknown slug', () => {
    expect(resolveSpecHref('spec://unknown', index)).toBeNull()
  })
})
