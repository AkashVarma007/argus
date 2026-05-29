import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useNodeDrag } from '@/lib/hooks/useNodeDrag'

function makeDownEvent(overrides: Partial<PointerEvent> = {}): PointerEvent {
  return {
    button: 0,
    shiftKey: false,
    ctrlKey: false,
    metaKey: false,
    clientX: 0,
    clientY: 0,
    pointerId: 1,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  } as unknown as PointerEvent
}

function dispatchPointerMove(clientX: number, clientY: number) {
  const ev = new Event('pointermove') as PointerEvent
  Object.defineProperty(ev, 'clientX', { value: clientX })
  Object.defineProperty(ev, 'clientY', { value: clientY })
  window.dispatchEvent(ev)
}

function dispatchPointerUp() {
  window.dispatchEvent(new Event('pointerup'))
}

describe('useNodeDrag', () => {
  it('translates pointer deltas into world deltas using viewport zoom', () => {
    const onDrag = vi.fn()
    const { result } = renderHook(() =>
      useNodeDrag({ onDrag, getViewport: () => ({ zoom: 2 }) }),
    )
    act(() => result.current.onPointerDown(makeDownEvent(), 'n-1', { x: 10, y: 10 }))
    act(() => dispatchPointerMove(40, 60))
    expect(onDrag).toHaveBeenLastCalledWith('n-1', { x: 30, y: 40 })
    act(() => dispatchPointerUp())
  })

  it('ignores non-primary buttons', () => {
    const onDrag = vi.fn()
    const { result } = renderHook(() =>
      useNodeDrag({ onDrag, getViewport: () => ({ zoom: 1 }) }),
    )
    act(() =>
      result.current.onPointerDown(makeDownEvent({ button: 1 }), 'n-1', { x: 0, y: 0 }),
    )
    act(() => dispatchPointerMove(50, 50))
    expect(onDrag).not.toHaveBeenCalled()
  })

  it('skips drag when shift is held (reserved for pan)', () => {
    const onDrag = vi.fn()
    const { result } = renderHook(() =>
      useNodeDrag({ onDrag, getViewport: () => ({ zoom: 1 }) }),
    )
    act(() =>
      result.current.onPointerDown(makeDownEvent({ shiftKey: true }), 'n-1', { x: 0, y: 0 }),
    )
    act(() => dispatchPointerMove(20, 20))
    expect(onDrag).not.toHaveBeenCalled()
  })

  it('snaps position to grid when snap is set', () => {
    const onDrag = vi.fn()
    const { result } = renderHook(() =>
      useNodeDrag({ onDrag, getViewport: () => ({ zoom: 1 }), snap: 8 }),
    )
    act(() => result.current.onPointerDown(makeDownEvent(), 'n-1', { x: 0, y: 0 }))
    act(() => dispatchPointerMove(11, 11))
    expect(onDrag).toHaveBeenLastCalledWith('n-1', { x: 8, y: 8 })
    act(() => dispatchPointerMove(13, 13))
    expect(onDrag).toHaveBeenLastCalledWith('n-1', { x: 16, y: 16 })
    act(() => dispatchPointerUp())
  })

  it('invokes onDragEnd with the final position on pointerup', () => {
    const onDrag = vi.fn()
    const onDragEnd = vi.fn()
    const { result } = renderHook(() =>
      useNodeDrag({ onDrag, onDragEnd, getViewport: () => ({ zoom: 1 }) }),
    )
    act(() => result.current.onPointerDown(makeDownEvent(), 'n-1', { x: 0, y: 0 }))
    act(() => dispatchPointerMove(20, 30))
    act(() => dispatchPointerUp())
    expect(onDragEnd).toHaveBeenCalledWith('n-1', { x: 20, y: 30 })
  })

  it('stops dispatching after pointerup', () => {
    const onDrag = vi.fn()
    const { result } = renderHook(() =>
      useNodeDrag({ onDrag, getViewport: () => ({ zoom: 1 }) }),
    )
    act(() => result.current.onPointerDown(makeDownEvent(), 'n-1', { x: 0, y: 0 }))
    act(() => dispatchPointerMove(10, 10))
    act(() => dispatchPointerUp())
    const before = onDrag.mock.calls.length
    act(() => dispatchPointerMove(50, 50))
    expect(onDrag.mock.calls.length).toBe(before)
  })
})
