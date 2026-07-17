'use client'
import { useEffect } from 'react'

interface AnchorPulseProps {
  anchorId: string | null
  containerRef: React.RefObject<HTMLElement | null>
  trigger: string | number
}

const PULSE_MS = 1200

export function AnchorPulse({ anchorId, containerRef, trigger }: AnchorPulseProps) {
  useEffect(() => {
    if (!anchorId) return
    const root = containerRef.current
    if (!root) return
    const target = root.querySelector<HTMLElement>(`#${cssEscape(anchorId)}`)
    if (!target) return
    target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    target.setAttribute('data-pulse', 'true')
    const id = window.setTimeout(() => {
      target.removeAttribute('data-pulse')
    }, PULSE_MS)
    return () => {
      window.clearTimeout(id)
      target.removeAttribute('data-pulse')
    }
  }, [anchorId, trigger, containerRef])

  return null
}

function cssEscape(s: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(s)
  return s.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`)
}
