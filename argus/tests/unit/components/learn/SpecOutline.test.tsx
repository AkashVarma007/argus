import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SpecOutline } from '@/components/learn/SpecOutline'
import type { SpecAnchor } from '@/lib/learn/types'

const anchors: SpecAnchor[] = [
  { id: 'overview', text: 'Overview', level: 2 },
  { id: 'detail', text: 'Detail', level: 3 },
  { id: 'second-section', text: 'Second Section', level: 2 },
]

describe('SpecOutline', () => {
  it('renders h2 and h3 anchors', () => {
    const { container } = render(
      <SpecOutline anchors={anchors} activeAnchorId={null} onJump={() => {}} />,
    )
    const items = container.querySelectorAll('button[data-anchor-id]')
    expect(items.length).toBe(3)
  })

  it('skips h1-level anchors', () => {
    const { container } = render(
      <SpecOutline
        anchors={[
          { id: 'top', text: 'Top', level: 1 },
          { id: 's', text: 'S', level: 2 },
        ]}
        activeAnchorId={null}
        onJump={() => {}}
      />,
    )
    expect(container.querySelector('button[data-anchor-id="top"]')).toBeNull()
    expect(container.querySelector('button[data-anchor-id="s"]')).not.toBeNull()
  })

  it('marks h3 with itemDeep variant via data-level', () => {
    const { container } = render(
      <SpecOutline anchors={anchors} activeAnchorId={null} onJump={() => {}} />,
    )
    const h3 = container.querySelector(
      'button[data-anchor-id="detail"]',
    ) as HTMLButtonElement
    expect(h3.getAttribute('data-level')).toBe('3')
  })

  it('marks active anchor', () => {
    const { container } = render(
      <SpecOutline anchors={anchors} activeAnchorId={'detail'} onJump={() => {}} />,
    )
    const active = container.querySelector('button[data-active="true"]')
    expect(active?.getAttribute('data-anchor-id')).toBe('detail')
  })

  it('fires onJump when an anchor is clicked', () => {
    const onJump = vi.fn()
    const { container } = render(
      <SpecOutline anchors={anchors} activeAnchorId={null} onJump={onJump} />,
    )
    const btn = container.querySelector(
      'button[data-anchor-id="overview"]',
    ) as HTMLButtonElement
    fireEvent.click(btn)
    expect(onJump).toHaveBeenCalledWith('overview')
  })

  it('shows empty state when no anchors present', () => {
    const { container } = render(
      <SpecOutline anchors={[]} activeAnchorId={null} onJump={() => {}} />,
    )
    expect(container.textContent).toContain('No sections.')
  })

  it('renders related checks when provided', () => {
    const { container } = render(
      <SpecOutline
        anchors={anchors}
        activeAnchorId={null}
        onJump={() => {}}
        relatedChecks={[
          { id: 'lifecycle.init', label: 'lifecycle.init' },
          { id: 'lifecycle.shutdown', label: 'lifecycle.shutdown' },
        ]}
      />,
    )
    const checks = container.querySelectorAll('[data-check-id]')
    expect(checks.length).toBe(2)
  })
})
