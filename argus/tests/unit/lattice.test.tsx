import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Mark } from '@/components/lattice/Mark'
import { MiniStrip } from '@/components/lattice/MiniStrip'

describe('Mark', () => {
  it('renders a 4x4 grid (16 rects)', () => {
    const { container } = render(<Mark />)
    expect(container.querySelectorAll('rect').length).toBe(16)
  })

  it('honors size prop', () => {
    const { container } = render(<Mark size={32} />)
    const svg = container.querySelector('svg') as SVGElement
    expect(svg.getAttribute('width')).toBe('32')
    expect(svg.getAttribute('height')).toBe('32')
  })
})

describe('MiniStrip', () => {
  it('renders one column per category (default 19)', () => {
    const { container } = render(<MiniStrip />)
    expect(container.querySelectorAll('[data-argus="mini-cell"]').length).toBe(19)
  })

  it('marks failing columns with data-state="fail"', () => {
    const states: Array<'pass' | 'fail' | 'skip'> = Array(19).fill('pass')
    states[3] = 'fail'
    const { container } = render(<MiniStrip states={states} />)
    const cells = container.querySelectorAll('[data-argus="mini-cell"]')
    expect((cells[3] as HTMLElement).dataset.state).toBe('fail')
  })
})
