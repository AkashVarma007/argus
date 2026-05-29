import { useCallback, useEffect, useRef, useState } from 'react'

export interface Viewport {
  x: number
  y: number
  zoom: number
}

export interface UseViewportOpts {
  initial: Viewport
  minZoom?: number
  maxZoom?: number
  onChange?: (v: Viewport) => void
}

export interface UseViewportReturn {
  viewport: Viewport
  setViewport: (v: Viewport) => void
  bindPan: (target: HTMLElement | null) => void
  bindZoom: (target: HTMLElement | null) => void
  screenToWorld: (sx: number, sy: number) => { x: number; y: number }
  worldToScreen: (wx: number, wy: number) => { x: number; y: number }
}

function clampZoom(z: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, z))
}

export function useViewport(opts: UseViewportOpts): UseViewportReturn {
  const minZoom = opts.minZoom ?? 0.25
  const maxZoom = opts.maxZoom ?? 4
  const [viewport, setViewportState] = useState<Viewport>(opts.initial)
  const vpRef = useRef(viewport)
  vpRef.current = viewport

  const commit = useCallback(
    (next: Viewport) => {
      setViewportState(next)
      opts.onChange?.(next)
    },
    [opts],
  )

  const setViewport = useCallback(
    (next: Viewport) => {
      commit({ ...next, zoom: clampZoom(next.zoom, minZoom, maxZoom) })
    },
    [commit, minZoom, maxZoom],
  )

  const screenToWorld = useCallback(
    (sx: number, sy: number) => {
      const v = vpRef.current
      return { x: (sx - v.x) / v.zoom, y: (sy - v.y) / v.zoom }
    },
    [],
  )

  const worldToScreen = useCallback(
    (wx: number, wy: number) => {
      const v = vpRef.current
      return { x: wx * v.zoom + v.x, y: wy * v.zoom + v.y }
    },
    [],
  )

  const panTargetRef = useRef<HTMLElement | null>(null)
  const zoomTargetRef = useRef<HTMLElement | null>(null)

  const bindPan = useCallback((target: HTMLElement | null) => {
    panTargetRef.current = target
  }, [])

  const bindZoom = useCallback((target: HTMLElement | null) => {
    zoomTargetRef.current = target
  }, [])

  useEffect(() => {
    const el = panTargetRef.current
    if (!el) return undefined
    let panning = false
    let startX = 0
    let startY = 0
    let startVp: Viewport = vpRef.current

    function onPointerDown(e: PointerEvent) {
      const isPanGesture = e.button === 1 || (e.button === 0 && e.shiftKey)
      if (!isPanGesture) return
      panning = true
      startX = e.clientX
      startY = e.clientY
      startVp = vpRef.current
      el?.setPointerCapture?.(e.pointerId)
      e.preventDefault()
    }
    function onPointerMove(e: PointerEvent) {
      if (!panning) return
      const dx = e.clientX - startX
      const dy = e.clientY - startY
      commit({ ...startVp, x: startVp.x + dx, y: startVp.y + dy })
    }
    function onPointerUp(e: PointerEvent) {
      if (!panning) return
      panning = false
      el?.releasePointerCapture?.(e.pointerId)
    }
    el.addEventListener('pointerdown', onPointerDown)
    el.addEventListener('pointermove', onPointerMove)
    el.addEventListener('pointerup', onPointerUp)
    el.addEventListener('pointercancel', onPointerUp)
    return () => {
      el.removeEventListener('pointerdown', onPointerDown)
      el.removeEventListener('pointermove', onPointerMove)
      el.removeEventListener('pointerup', onPointerUp)
      el.removeEventListener('pointercancel', onPointerUp)
    }
  }, [commit])

  useEffect(() => {
    const el = zoomTargetRef.current
    if (!el) return undefined
    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey) return
      e.preventDefault()
      const v = vpRef.current
      const factor = Math.exp(-e.deltaY / 200)
      const nextZoom = clampZoom(v.zoom * factor, minZoom, maxZoom)
      const ratio = nextZoom / v.zoom
      const cx = e.clientX
      const cy = e.clientY
      const nextX = cx - (cx - v.x) * ratio
      const nextY = cy - (cy - v.y) * ratio
      commit({ x: nextX, y: nextY, zoom: nextZoom })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [commit, minZoom, maxZoom])

  return {
    viewport,
    setViewport,
    bindPan,
    bindZoom,
    screenToWorld,
    worldToScreen,
  }
}
