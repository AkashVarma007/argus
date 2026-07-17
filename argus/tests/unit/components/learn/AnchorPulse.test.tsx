import { describe, it, expect, vi } from 'vitest'
import { createRef } from 'react'
import { render, act } from '@testing-library/react'
import { AnchorPulse } from '@/components/learn/AnchorPulse'

function makeHost(): HTMLDivElement {
  const host = document.createElement('div')
  const h = document.createElement('h2')
  h.id = 'streaming-http'
  h.textContent = 'Streaming HTTP'
  host.appendChild(h)
  document.body.appendChild(host)
  return host
}

describe('AnchorPulse', () => {
  it('adds data-pulse and removes it after 1.2s', () => {
    vi.useFakeTimers()
    const host = makeHost()
    const ref = createRef<HTMLElement>()
    ;(ref as { current: HTMLElement | null }).current = host
    const target = host.querySelector('#streaming-http') as HTMLElement
    target.scrollIntoView = vi.fn()
    render(<AnchorPulse anchorId="streaming-http" containerRef={ref} trigger="t1" />)
    expect(target.getAttribute('data-pulse')).toBe('true')
    act(() => {
      vi.advanceTimersByTime(1200)
    })
    expect(target.getAttribute('data-pulse')).toBeNull()
    vi.useRealTimers()
    host.remove()
  })

  it('does nothing when anchorId is null', () => {
    const host = makeHost()
    const ref = createRef<HTMLElement>()
    ;(ref as { current: HTMLElement | null }).current = host
    render(<AnchorPulse anchorId={null} containerRef={ref} trigger="t1" />)
    expect(host.querySelector('[data-pulse]')).toBeNull()
    host.remove()
  })
})
