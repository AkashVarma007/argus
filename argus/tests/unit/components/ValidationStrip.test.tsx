import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { ValidationStrip } from '@/components/build/ValidationStrip'
import { _resetSpecIndexForTests } from '@/lib/learn/useSpecIndex'
import type { BuildIssue } from '@/lib/store/types'
import type { SpecIndex } from '@/lib/learn/types'

const fakeIndex: SpecIndex = {
  version: 'draft-2026-v1',
  generatedAt: '2026-05-29T00:00:00.000Z',
  tree: [],
  entries: [
    {
      slug: 'basic/lifecycle',
      title: 'Lifecycle',
      excerpt: '',
      parentSlug: 'basic',
      anchors: [
        { id: 'protocol-version-negotiation', text: 'Protocol Version Negotiation', level: 2 },
      ],
    },
  ],
}

beforeEach(() => {
  _resetSpecIndexForTests()
})

describe('ValidationStrip', () => {
  it('renders empty-state message when no issues', () => {
    const { getByText } = render(<ValidationStrip issues={[]} />)
    expect(getByText('no issues — ready to generate')).toBeTruthy()
  })

  it('counts errors and warnings separately', () => {
    const issues: BuildIssue[] = [
      { severity: 'error', message: 'no server' },
      { severity: 'warning', message: 'missing description' },
      { severity: 'warning', message: 'not semver' },
    ]
    const { container } = render(<ValidationStrip issues={issues} />)
    const errorCount = container.querySelector('[data-severity="error"]')
    const warnCount = container.querySelector('[data-severity="warning"]')
    expect(errorCount?.textContent).toContain('1 error')
    expect(warnCount?.textContent).toContain('2 warnings')
  })

  it('invokes onFocus with the issue when an item is clicked', () => {
    const onFocus = vi.fn()
    const issue: BuildIssue = {
      severity: 'error',
      nodeId: 'n-2',
      message: 'duplicate tool name',
    }
    const { getByText } = render(<ValidationStrip issues={[issue]} onFocus={onFocus} />)
    fireEvent.click(getByText('duplicate tool name'))
    expect(onFocus).toHaveBeenCalledWith(issue)
  })

  it('renders a spec link when an issue has a specRef and the index resolves', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(fakeIndex), { status: 200 })),
    )
    const issue: BuildIssue = {
      severity: 'error',
      message: 'no server',
      specRef: 'spec://basic/lifecycle#protocol-version-negotiation',
    }
    const { container } = render(<ValidationStrip issues={[issue]} />)
    const link = await waitFor(() => {
      const el = container.querySelector('a[data-spec-link="true"]') as HTMLAnchorElement | null
      expect(el).not.toBeNull()
      return el!
    })
    expect(link.getAttribute('href')).toBe(
      '/learn/basic/lifecycle?pulse=protocol-version-negotiation#protocol-version-negotiation',
    )
    expect(link.getAttribute('target')).toBe('_blank')
  })

  it('omits the link when issue has no specRef', () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(fakeIndex), { status: 200 })),
    )
    const issue: BuildIssue = { severity: 'warning', message: 'orphan' }
    const { container } = render(<ValidationStrip issues={[issue]} />)
    expect(container.querySelector('a[data-spec-link="true"]')).toBeNull()
  })
})
