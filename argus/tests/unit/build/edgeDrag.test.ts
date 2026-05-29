import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useEdgeDrag } from '@/lib/hooks/useEdgeDrag'

function makeDownEvent(): PointerEvent {
  return {
    button: 0,
    clientX: 0,
    clientY: 0,
    pointerId: 1,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  } as unknown as PointerEvent
}

function dispatchPointerMove(clientX: number, clientY: number) {
  const ev = new Event('pointermove') as PointerEvent
  Object.defineProperty(ev, 'clientX', { value: clientX })
  Object.defineProperty(ev, 'clientY', { value: clientY })
  window.dispatchEvent(ev)
}

function dispatchPointerUp(clientX: number, clientY: number) {
  const ev = new Event('pointerup') as PointerEvent
  Object.defineProperty(ev, 'clientX', { value: clientX })
  Object.defineProperty(ev, 'clientY', { value: clientY })
  window.dispatchEvent(ev)
}

describe('useEdgeDrag', () => {
  it('seeds a draft on anchor-down and updates cursor on move', () => {
    const screenToWorld = (sx: number, sy: number) => ({ x: sx, y: sy })
    const { result } = renderHook(() =>
      useEdgeDrag({
        onCreate: vi.fn(),
        getDropTarget: () => null,
        screenToWorld,
      }),
    )
    act(() =>
      result.current.onAnchorDown(
        makeDownEvent(),
        { nodeId: 'n-1', anchor: 'out' },
        { x: 10, y: 10 },
      ),
    )
    expect(result.current.draft).toEqual({
      source: { nodeId: 'n-1', anchor: 'out', point: { x: 10, y: 10 } },
      cursor: { x: 10, y: 10 },
    })
    act(() => dispatchPointerMove(50, 30))
    expect(result.current.draft?.cursor).toEqual({ x: 50, y: 30 })
    act(() => dispatchPointerUp(50, 30))
  })

  it('commits edge when pointerup lands on a drop target', () => {
    const onCreate = vi.fn()
    const target = { nodeId: 'n-2', anchor: 'in' as const }
    const { result } = renderHook(() =>
      useEdgeDrag({
        onCreate,
        getDropTarget: () => target,
        screenToWorld: (sx, sy) => ({ x: sx, y: sy }),
      }),
    )
    act(() =>
      result.current.onAnchorDown(
        makeDownEvent(),
        { nodeId: 'n-1', anchor: 'out' },
        { x: 0, y: 0 },
      ),
    )
    act(() => dispatchPointerUp(100, 100))
    expect(onCreate).toHaveBeenCalledWith(
      { nodeId: 'n-1', anchor: 'out' },
      target,
    )
    expect(result.current.draft).toBeNull()
  })

  it('cancels draft on pointerup over empty space', () => {
    const onCreate = vi.fn()
    const { result } = renderHook(() =>
      useEdgeDrag({
        onCreate,
        getDropTarget: () => null,
        screenToWorld: (sx, sy) => ({ x: sx, y: sy }),
      }),
    )
    act(() =>
      result.current.onAnchorDown(
        makeDownEvent(),
        { nodeId: 'n-1', anchor: 'out' },
        { x: 0, y: 0 },
      ),
    )
    act(() => dispatchPointerUp(999, 999))
    expect(onCreate).not.toHaveBeenCalled()
    expect(result.current.draft).toBeNull()
  })
})
