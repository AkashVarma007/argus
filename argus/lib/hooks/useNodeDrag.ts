import { useCallback, useRef } from 'react'

export interface UseNodeDragOpts {
  onDrag: (id: string, position: { x: number; y: number }) => void
  onDragEnd?: (id: string, position: { x: number; y: number }) => void
  getViewport: () => { zoom: number }
  snap?: number
}

interface DragState {
  id: string
  startClientX: number
  startClientY: number
  startX: number
  startY: number
  lastX: number
  lastY: number
}

export interface UseNodeDragReturn {
  onPointerDown: (
    e: PointerEvent | React.PointerEvent,
    id: string,
    startPos: { x: number; y: number },
  ) => void
}

export function useNodeDrag(opts: UseNodeDragOpts): UseNodeDragReturn {
  const optsRef = useRef(opts)
  optsRef.current = opts
  const stateRef = useRef<DragState | null>(null)

  const onPointerDown = useCallback(
    (
      e: PointerEvent | React.PointerEvent,
      id: string,
      startPos: { x: number; y: number },
    ) => {
      if (e.button !== 0) return
      if (e.shiftKey || e.ctrlKey || e.metaKey) return
      stateRef.current = {
        id,
        startClientX: e.clientX,
        startClientY: e.clientY,
        startX: startPos.x,
        startY: startPos.y,
        lastX: startPos.x,
        lastY: startPos.y,
      }
      e.preventDefault?.()
      e.stopPropagation?.()

      function onMove(ev: PointerEvent) {
        const s = stateRef.current
        if (!s) return
        const zoom = optsRef.current.getViewport().zoom || 1
        const dx = (ev.clientX - s.startClientX) / zoom
        const dy = (ev.clientY - s.startClientY) / zoom
        let nx = s.startX + dx
        let ny = s.startY + dy
        const snap = optsRef.current.snap
        if (snap && snap > 0) {
          nx = Math.round(nx / snap) * snap
          ny = Math.round(ny / snap) * snap
        }
        s.lastX = nx
        s.lastY = ny
        optsRef.current.onDrag(s.id, { x: nx, y: ny })
      }
      function onUp() {
        const s = stateRef.current
        if (s) {
          optsRef.current.onDragEnd?.(s.id, { x: s.lastX, y: s.lastY })
        }
        stateRef.current = null
        window.removeEventListener('pointermove', onMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    },
    [],
  )

  return { onPointerDown }
}
