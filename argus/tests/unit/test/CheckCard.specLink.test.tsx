import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CheckCard } from '@/components/test/CheckCard'
import { _resetSpecIndexForTests } from '@/lib/learn/useSpecIndex'
import type { CheckResult } from '@/lib/store/types'
import type { SpecIndex } from '@/lib/learn/types'

const fakeIndex: SpecIndex = {
  version: 'draft-2026-v1',
  generatedAt: '2026-05-29T00:00:00.000Z',
  tree: [],
  entries: [
    {
      slug: 'basic/lifecycle',
      title: 'Lifecycle',
      excerpt: 'Initialization and shutdown.',
      parentSlug: 'basic',
      anchors: [{ id: 'initialization', text: 'Initialization', level: 2 }],
    },
  ],
}

const failResult: CheckResult = {
  checkId: 'L-01',
  category: 'lifecycle',
  severity: 'major',
  status: 'fail',
  durationMs: 7,
  observed: 'No initialize response',
  expected: 'initialize response within 5s',
  specRef: 'spec://basic/lifecycle#initialization',
  fixHint: 'Implement initialize handler',
}

beforeEach(() => {
  _resetSpecIndexForTests()
})

describe('CheckCard spec link', () => {
  it('renders Open spec anchor pointing at the resolved slug+anchor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(fakeIndex), { status: 200 })),
    )
    render(<CheckCard result={failResult} title="Lifecycle init" specQuote="MUST respond." />)
    const link = await waitFor(() => {
      const el = screen.getByText(/Open spec/i).closest('a') as HTMLAnchorElement | null
      expect(el).not.toBeNull()
      return el!
    })
    expect(link.getAttribute('href')).toBe(
      '/learn/basic/lifecycle?pulse=initialization#initialization',
    )
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
  })

  it('renders nothing when specRef is non-spec scheme', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(fakeIndex), { status: 200 })),
    )
    render(
      <CheckCard
        result={{ ...failResult, specRef: 'https://example.com/spec' }}
        title="t"
        specQuote="q"
      />,
    )
    expect(screen.queryByText(/Open spec/i)).toBeNull()
  })

  it('renders nothing when specRef is empty', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(fakeIndex), { status: 200 })),
    )
    render(
      <CheckCard
        result={{ ...failResult, specRef: undefined }}
        title="t"
        specQuote="q"
      />,
    )
    expect(screen.queryByText(/Open spec/i)).toBeNull()
  })
})
