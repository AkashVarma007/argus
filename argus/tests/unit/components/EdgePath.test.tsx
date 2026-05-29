import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { EdgePath, edgePathD } from '@/components/build/EdgePath'

describe('edgePathD', () => {
  it('emits a cubic bezier between source and target', () => {
    const d = edgePathD({ x: 0, y: 0 }, { x: 200, y: 100 })
    expect(d.startsWith('M 0 0 C')).toBe(true)
    expect(d.endsWith('200 100')).toBe(true)
  })

  it('uses a minimum control-point pull for short edges', () => {
    const d = edgePathD({ x: 0, y: 0 }, { x: 10, y: 0 })
    expect(d).toContain('C 40 0')
    expect(d).toContain('-30 0')
  })
})

describe('EdgePath', () => {
  it('renders a path with the kind attribute', () => {
    const { container } = render(
      <svg>
        <EdgePath source={{ x: 0, y: 0 }} target={{ x: 100, y: 50 }} kind="membership" />
      </svg>,
    )
    const path = container.querySelector('[data-argus="edge"]') as SVGPathElement | null
    expect(path).toBeTruthy()
    expect(path?.getAttribute('data-kind')).toBe('membership')
  })

  it('reflects the selected state via data attribute', () => {
    const { container } = render(
      <svg>
        <EdgePath source={{ x: 0, y: 0 }} target={{ x: 1, y: 1 }} kind="dependency" selected />
      </svg>,
    )
    const path = container.querySelector('[data-argus="edge"]')
    expect(path?.getAttribute('data-selected')).toBe('true')
  })

  it('invokes onClick when the path is clicked', () => {
    const onClick = vi.fn()
    const { container } = render(
      <svg>
        <EdgePath
          source={{ x: 0, y: 0 }}
          target={{ x: 1, y: 1 }}
          kind="prompt-uses-tool"
          onClick={onClick}
        />
      </svg>,
    )
    const path = container.querySelector('[data-argus="edge"]') as SVGPathElement
    fireEvent.click(path)
    expect(onClick).toHaveBeenCalledTimes(1)
  })
})
