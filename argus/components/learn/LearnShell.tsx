'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { SpecTree } from './SpecTree'
import { SpecBody } from './SpecBody'
import { SpecOutline } from './SpecOutline'
import { CommandPalette } from './CommandPalette'
import { AnchorPulse } from './AnchorPulse'
import { useSpecBody } from '@/lib/learn/useSpecBody'
import { searchSpec } from '@/lib/learn/search'
import type { SpecAnchor, SpecIndex } from '@/lib/learn/types'
import styles from './LearnShell.module.css'

interface LearnShellProps {
  index: SpecIndex
  activeSlug: string
  activeAnchor: string | null
  onNavigate: (slug: string, anchor: string | null) => void
}

export function LearnShell({
  index,
  activeSlug,
  activeAnchor,
  onNavigate,
}: LearnShellProps) {
  const { body, loading, error } = useSpecBody(activeSlug)
  const [anchors, setAnchors] = useState<SpecAnchor[]>([])
  const [observedActiveId, setObservedActiveId] = useState<string | null>(activeAnchor)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const bodyRef = useRef<HTMLElement | null>(null)

  const onAnchorMount = useCallback((next: SpecAnchor[]) => {
    setAnchors(next)
    bodyRef.current = document.querySelector<HTMLElement>(
      '[data-argus="spec-body"]',
    )
  }, [])

  useEffect(() => {
    setObservedActiveId(activeAnchor)
  }, [activeAnchor, activeSlug])

  useEffect(() => {
    if (!anchors.length) return
    const root =
      bodyRef.current ??
      document.querySelector<HTMLElement>('[data-argus="spec-body"]')
    if (!root) return
    const els = anchors
      .map((a) => root.querySelector<HTMLElement>(`[id="${cssEscape(a.id)}"]`))
      .filter((el): el is HTMLElement => el !== null)
    if (!els.length) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.target.getBoundingClientRect().top - b.target.getBoundingClientRect().top)
        if (visible[0]) {
          setObservedActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [anchors])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMeta = e.metaKey || e.ctrlKey
      if (isMeta && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const search = useCallback((q: string) => searchSpec(index, q), [index])

  const containerRef = useRef<HTMLElement | null>(null)
  useEffect(() => {
    containerRef.current = document.querySelector<HTMLElement>(
      '[data-argus="spec-body"]',
    )
  }, [body])

  const safeBody = body ?? ''

  return (
    <div data-argus="learn-shell" className={styles.root}>
      <SpecTree
        tree={index.tree}
        activeSlug={activeSlug}
        onSelect={(slug) => onNavigate(slug, null)}
      />
      <div className={styles.center}>
        {loading && <div className={styles.status}>Loading...</div>}
        {error && <div className={styles.status}>Error: {error}</div>}
        {!loading && !error && (
          <SpecBody markdown={safeBody} onAnchorMount={onAnchorMount} />
        )}
      </div>
      <SpecOutline
        anchors={anchors}
        activeAnchorId={observedActiveId}
        onJump={(id) => onNavigate(activeSlug, id)}
      />
      <AnchorPulse
        anchorId={activeAnchor}
        containerRef={containerRef}
        trigger={`${activeSlug}#${activeAnchor ?? ''}#${anchors.length}`}
      />
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onPick={(slug, anchor) => {
          setPaletteOpen(false)
          onNavigate(slug, anchor)
        }}
        search={search}
      />
    </div>
  )
}

function cssEscape(s: string): string {
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(s)
  return s.replace(/[^a-zA-Z0-9_-]/g, (c) => `\\${c}`)
}
