import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import { LearnShell } from '@/components/learn/LearnShell'
import { _resetSpecBodyForTests } from '@/lib/learn/useSpecBody'
import type { SpecIndex } from '@/lib/learn/types'

const index: SpecIndex = {
  version: 'draft-2026-v1',
  generatedAt: '2026-05-29T00:00:00.000Z',
  tree: [
    {
      slug: 'basic',
      title: 'Basic',
      parentSlug: null,
      children: [
        {
          slug: 'basic/transports',
          title: 'Transports',
          parentSlug: 'basic',
          children: [],
        },
      ],
    },
  ],
  entries: [
    {
      slug: 'basic/transports',
      title: 'Transports',
      excerpt: 'Streaming HTTP and stdio transports.',
      parentSlug: 'basic',
      anchors: [{ id: 'streaming-http', text: 'Streaming HTTP', level: 2 }],
    },
  ],
}

class MockIO {
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

beforeEach(() => {
  _resetSpecBodyForTests()
  vi.stubGlobal(
    'IntersectionObserver',
    vi.fn().mockImplementation(() => new MockIO()),
  )
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('# Transports\n\n## Streaming HTTP\n\nBody.', { status: 200 })),
  )
})

describe('LearnShell', () => {
  it('renders tree, body, outline once body is loaded', async () => {
    const { container } = render(
      <LearnShell
        index={index}
        activeSlug={'basic/transports'}
        activeAnchor={null}
        onNavigate={() => {}}
      />,
    )
    await waitFor(() => {
      expect(container.querySelector('[data-argus="spec-body"]')).not.toBeNull()
    })
    expect(container.querySelector('[data-argus="spec-tree"]')).not.toBeNull()
    expect(container.querySelector('[data-argus="spec-outline"]')).not.toBeNull()
    expect(container.querySelector('h1')?.textContent).toBe('Transports')
  })

  it('shows loading status while fetching', () => {
    const { container } = render(
      <LearnShell
        index={index}
        activeSlug={'basic/transports'}
        activeAnchor={null}
        onNavigate={() => {}}
      />,
    )
    expect(container.textContent).toContain('Loading')
  })
})
