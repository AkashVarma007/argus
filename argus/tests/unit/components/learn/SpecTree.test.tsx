import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SpecTree } from '@/components/learn/SpecTree'
import type { SpecNode } from '@/lib/learn/types'

const tree: SpecNode[] = [
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
      {
        slug: 'basic/lifecycle',
        title: 'Lifecycle',
        parentSlug: 'basic',
        children: [],
      },
    ],
  },
  {
    slug: 'server',
    title: 'Server',
    parentSlug: null,
    children: [
      {
        slug: 'server/tools',
        title: 'Tools',
        parentSlug: 'server',
        children: [],
      },
    ],
  },
]

describe('SpecTree', () => {
  it('renders root nodes', () => {
    const { container } = render(
      <SpecTree tree={tree} activeSlug={null} onSelect={() => {}} />,
    )
    const labels = container.querySelectorAll('button[data-slug]')
    const slugs = Array.from(labels).map((el) => el.getAttribute('data-slug'))
    expect(slugs).toContain('basic')
    expect(slugs).toContain('server')
  })

  it('expands ancestors of active slug by default', () => {
    const { container } = render(
      <SpecTree tree={tree} activeSlug={'basic/transports'} onSelect={() => {}} />,
    )
    const slugs = Array.from(container.querySelectorAll('button[data-slug]')).map((el) =>
      el.getAttribute('data-slug'),
    )
    expect(slugs).toContain('basic/transports')
  })

  it('marks active row with data-active', () => {
    const { container } = render(
      <SpecTree tree={tree} activeSlug={'basic/lifecycle'} onSelect={() => {}} />,
    )
    const active = container.querySelector('[data-active="true"]')
    expect(active).not.toBeNull()
    expect(active?.querySelector('button[data-slug]')?.getAttribute('data-slug')).toBe(
      'basic/lifecycle',
    )
  })

  it('fires onSelect when a leaf is clicked', () => {
    const onSelect = vi.fn()
    const { container } = render(
      <SpecTree tree={tree} activeSlug={'basic/transports'} onSelect={onSelect} />,
    )
    const leaf = container.querySelector(
      'button[data-slug="basic/transports"]',
    ) as HTMLButtonElement
    fireEvent.click(leaf)
    expect(onSelect).toHaveBeenCalledWith('basic/transports')
  })

  it('toggles children visibility when triangle clicked', () => {
    const { container } = render(
      <SpecTree tree={tree} activeSlug={'basic/transports'} onSelect={() => {}} />,
    )
    expect(
      container.querySelector('button[data-slug="basic/transports"]'),
    ).not.toBeNull()
    const tri = container
      .querySelector('button[data-slug="basic"]')
      ?.parentElement?.querySelector('button[aria-label]') as HTMLButtonElement
    expect(tri).not.toBeNull()
    fireEvent.click(tri)
    expect(container.querySelector('button[data-slug="basic/transports"]')).toBeNull()
    fireEvent.click(tri)
    expect(
      container.querySelector('button[data-slug="basic/transports"]'),
    ).not.toBeNull()
  })

  it('starts non-active branches collapsed', () => {
    const { container } = render(
      <SpecTree tree={tree} activeSlug={'basic/transports'} onSelect={() => {}} />,
    )
    expect(container.querySelector('button[data-slug="server/tools"]')).toBeNull()
  })
})
