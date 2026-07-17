import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { CommandPalette } from '@/components/learn/CommandPalette'
import type { SpecSearchHit } from '@/lib/learn/search'

const sampleHits: SpecSearchHit[] = [
  {
    slug: 'basic/transports',
    title: 'Transports',
    excerpt: 'Streaming HTTP and stdio transports for MCP.',
    score: 0.1,
    matchedAnchor: { id: 'streaming-http', text: 'Streaming HTTP', level: 2 },
  },
  {
    slug: 'basic/lifecycle',
    title: 'Lifecycle',
    excerpt: 'Initialization and shutdown sequence.',
    score: 0.2,
    matchedAnchor: null,
  },
]

function search(q: string): SpecSearchHit[] {
  return q.trim() ? sampleHits : []
}

describe('CommandPalette', () => {
  it('renders nothing when closed', () => {
    const { container } = render(
      <CommandPalette
        open={false}
        onClose={() => {}}
        onPick={() => {}}
        search={search}
      />,
    )
    expect(container.querySelector('[data-argus="command-palette"]')).toBeNull()
  })

  it('renders modal when open', () => {
    const { container } = render(
      <CommandPalette open onClose={() => {}} onPick={() => {}} search={search} />,
    )
    expect(container.querySelector('[data-argus="command-palette"]')).not.toBeNull()
  })

  it('shows results after typing', () => {
    const { container, getByTestId } = render(
      <CommandPalette open onClose={() => {}} onPick={() => {}} search={search} />,
    )
    fireEvent.change(getByTestId('palette-input'), { target: { value: 'transports' } })
    const rows = container.querySelectorAll('[role="option"]')
    expect(rows.length).toBe(2)
  })

  it('navigates with ArrowDown and ArrowUp', () => {
    const { container, getByTestId } = render(
      <CommandPalette open onClose={() => {}} onPick={() => {}} search={search} />,
    )
    const input = getByTestId('palette-input')
    fireEvent.change(input, { target: { value: 'mcp' } })
    expect(
      container
        .querySelector('[role="option"][data-cursor="true"]')
        ?.querySelector('.crumb, [class*="crumb"]')?.textContent,
    ).toBe('basic/transports')
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(
      container
        .querySelector('[role="option"][data-cursor="true"]')
        ?.querySelector('[class*="crumb"]')?.textContent,
    ).toBe('basic/lifecycle')
    fireEvent.keyDown(input, { key: 'ArrowUp' })
    expect(
      container
        .querySelector('[role="option"][data-cursor="true"]')
        ?.querySelector('[class*="crumb"]')?.textContent,
    ).toBe('basic/transports')
  })

  it('Enter fires onPick with matched anchor when present', () => {
    const onPick = vi.fn()
    const onClose = vi.fn()
    const { getByTestId } = render(
      <CommandPalette open onClose={onClose} onPick={onPick} search={search} />,
    )
    fireEvent.change(getByTestId('palette-input'), { target: { value: 'mcp' } })
    fireEvent.keyDown(getByTestId('palette-input'), { key: 'Enter' })
    expect(onPick).toHaveBeenCalledWith('basic/transports', 'streaming-http')
    expect(onClose).toHaveBeenCalled()
  })

  it('Escape closes the palette', () => {
    const onClose = vi.fn()
    const { getByTestId } = render(
      <CommandPalette open onClose={onClose} onPick={() => {}} search={search} />,
    )
    fireEvent.keyDown(getByTestId('palette-input'), { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('shows empty message when query yields no results', () => {
    const { container, getByTestId } = render(
      <CommandPalette
        open
        onClose={() => {}}
        onPick={() => {}}
        search={() => []}
      />,
    )
    fireEvent.change(getByTestId('palette-input'), { target: { value: 'xyz' } })
    expect(container.textContent).toContain('No matches.')
  })
})
