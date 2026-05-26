import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { LiveDot } from '@/components/primitives/LiveDot'
import { Panel } from '@/components/primitives/Panel'
import { Button } from '@/components/primitives/Button'

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

describe('Panel', () => {
  it('renders children inside a panel element', () => {
    const { getByText } = render(<Panel><span>inside</span></Panel>)
    expect(getByText('inside')).toBeInTheDocument()
  })

  it('exposes elevated variant via data attribute', () => {
    const { container } = render(<Panel elevated>x</Panel>)
    const el = container.querySelector('[data-argus="panel"]') as HTMLElement
    expect(el.dataset.elevated).toBe('true')
  })

  it('exposes label via aria-label when title provided', () => {
    const { container } = render(<Panel title="results">x</Panel>)
    const el = container.querySelector('[data-argus="panel"]') as HTMLElement
    expect(el.getAttribute('aria-label')).toBe('results')
  })
})

describe('Button', () => {
  it('renders its children as label', () => {
    const { getByText } = render(<Button>Run scan</Button>)
    expect(getByText('Run scan')).toBeInTheDocument()
  })

  it('applies primary variant data attr by default', () => {
    const { container } = render(<Button>x</Button>)
    const el = container.querySelector('button') as HTMLElement
    expect(el.dataset.variant).toBe('primary')
  })

  it('honors variant=ghost', () => {
    const { container } = render(<Button variant="ghost">x</Button>)
    const el = container.querySelector('button') as HTMLElement
    expect(el.dataset.variant).toBe('ghost')
  })

  it('is disabled when prop disabled', () => {
    const { container } = render(<Button disabled>x</Button>)
    const el = container.querySelector('button') as HTMLButtonElement
    expect(el.disabled).toBe(true)
  })
})
