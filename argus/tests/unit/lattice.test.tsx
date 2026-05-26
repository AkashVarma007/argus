import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { Mark } from '@/components/lattice/Mark'

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
