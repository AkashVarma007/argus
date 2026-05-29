import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useViewport } from '@/lib/hooks/useViewport'

describe('useViewport', () => {
  it('screenToWorld and worldToScreen round-trip', () => {
    const { result } = renderHook(() =>
      useViewport({ initial: { x: 10, y: 20, zoom: 2 } }),
    )
    const w = result.current.screenToWorld(100, 200)
    const back = result.current.worldToScreen(w.x, w.y)
    expect(back.x).toBeCloseTo(100, 5)
    expect(back.y).toBeCloseTo(200, 5)
  })

  it('setViewport clamps zoom to [minZoom, maxZoom]', () => {
    const { result } = renderHook(() =>
      useViewport({
        initial: { x: 0, y: 0, zoom: 1 },
        minZoom: 0.5,
        maxZoom: 2,
      }),
    )
    act(() => result.current.setViewport({ x: 0, y: 0, zoom: 10 }))
    expect(result.current.viewport.zoom).toBe(2)
    act(() => result.current.setViewport({ x: 0, y: 0, zoom: 0.1 }))
    expect(result.current.viewport.zoom).toBe(0.5)
  })

  it('emits onChange on setViewport', () => {
    let captured: { x: number; y: number; zoom: number } | null = null
    const { result } = renderHook(() =>
      useViewport({
        initial: { x: 0, y: 0, zoom: 1 },
        onChange: (v) => {
          captured = v
        },
      }),
    )
    act(() => result.current.setViewport({ x: 5, y: 7, zoom: 1.5 }))
    expect(captured).toEqual({ x: 5, y: 7, zoom: 1.5 })
  })

  it('screen→world accounts for current zoom and origin offset', () => {
    const { result } = renderHook(() =>
      useViewport({ initial: { x: 100, y: 50, zoom: 2 } }),
    )
    expect(result.current.screenToWorld(120, 70)).toEqual({ x: 10, y: 10 })
  })
})
