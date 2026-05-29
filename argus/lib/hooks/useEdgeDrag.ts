import { useCallback, useRef, useState } from 'react'

export type AnchorSide = 'in' | 'out'

export interface AnchorRef {
  nodeId: string
  anchor: AnchorSide
}

export interface DraftEdge {
  source: AnchorRef & { point: { x: number; y: number } }
  cursor: { x: number; y: number }
}

export interface UseEdgeDragOpts {
  onCreate: (source: AnchorRef, target: AnchorRef) => void
  getDropTarget: (clientX: number, clientY: number) => AnchorRef | null
  screenToWorld: (clientX: number, clientY: number) => { x: number; y: number }
}

export interface UseEdgeDragReturn {
  draft: DraftEdge | null
  onAnchorDown: (
    e: PointerEvent | React.PointerEvent,
    source: AnchorRef,
    startWorld: { x: number; y: number },
  ) => void
}

interface DragState {
  source: AnchorRef
  startPoint: { x: number; y: number }
}

export function useEdgeDrag(opts: UseEdgeDragOpts): UseEdgeDragReturn {
  const optsRef = useRef(opts)
  optsRef.current = opts
  const stateRef = useRef<DragState | null>(null)
  const [draft, setDraft] = useState<DraftEdge | null>(null)

  const onAnchorDown = useCallback(
    (
      e: PointerEvent | React.PointerEvent,
      source: AnchorRef,
      startWorld: { x: number; y: number },
    ) => {
      if (e.button !== 0) return
      stateRef.current = { source, startPoint: startWorld }
      setDraft({
        source: { ...source, point: startWorld },
        cursor: startWorld,
      })
      e.preventDefault?.()
      e.stopPropagation?.()

      function onMove(ev: PointerEvent) {
        const s = stateRef.current
        if (!s) return
        const world = optsRef.current.screenToWorld(ev.clientX, ev.clientY)
        setDraft({
          source: { ...s.source, point: s.startPoint },
          cursor: world,
        })
      }
      function onUp(ev: PointerEvent) {
        const s = stateRef.current
        if (s) {
          const target = optsRef.current.getDropTarget(ev.clientX, ev.clientY)
          if (target) {
            optsRef.current.onCreate(s.source, target)
          }
        }
        stateRef.current = null
        setDraft(null)
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

  return { draft, onAnchorDown }
}
