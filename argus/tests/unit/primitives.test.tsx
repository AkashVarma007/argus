import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { LiveDot } from '@/components/primitives/LiveDot'

describe('LiveDot', () => {
  it('renders a circle with default size 6', () => {
    const { container } = render(<LiveDot />)
    const dot = container.querySelector('[data-argus="live-dot"]') as HTMLElement
    expect(dot).toBeInTheDocument()
    expect(dot.style.width).toBe('6px')
    expect(dot.style.height).toBe('6px')
  })

  it('honors the size prop', () => {
    const { container } = render(<LiveDot size={10} />)
    const dot = container.querySelector('[data-argus="live-dot"]') as HTMLElement
    expect(dot.style.width).toBe('10px')
  })

  it('applies pulse animation by default', () => {
    const { container } = render(<LiveDot />)
    const dot = container.querySelector('[data-argus="live-dot"]') as HTMLElement
    expect(dot.style.animationName).toBe('argus-pulse')
  })
})
