'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { SpecSearchHit } from '@/lib/learn/search'
import styles from './CommandPalette.module.css'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  onPick: (slug: string, anchor: string | null) => void
  search: (query: string) => SpecSearchHit[]
}

const VISIBLE_LIMIT = 8

export function CommandPalette({ open, onClose, onPick, search }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [cursor, setCursor] = useState(0)
  const inputRef = useRef<HTMLInputElement | null>(null)

  const hits = useMemo(() => {
    if (!query.trim()) return []
    return search(query).slice(0, VISIBLE_LIMIT)
  }, [query, search])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setCursor(0)
      return
    }
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    setCursor(0)
  }, [query])

  function commit(index: number) {
    const hit = hits[index]
    if (!hit) return
    onPick(hit.slug, hit.matchedAnchor?.id ?? null)
    onClose()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setCursor((c) => Math.min(c + 1, Math.max(hits.length - 1, 0)))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setCursor((c) => Math.max(c - 1, 0))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      commit(cursor)
    }
  }

  if (!open) return null

  return (
    <div
      data-argus="command-palette"
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="Spec search"
      onClick={onClose}
      onKeyDown={onKeyDown}
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search spec..."
          className={styles.input}
          data-testid="palette-input"
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
        />
        <ul className={styles.list} role="listbox">
          {hits.map((hit, i) => (
            <li
              key={`${hit.slug}-${i}`}
              role="option"
              aria-selected={i === cursor}
              data-cursor={i === cursor ? 'true' : undefined}
              className={i === cursor ? `${styles.row} ${styles.active}` : styles.row}
              onMouseEnter={() => setCursor(i)}
              onClick={() => commit(i)}
            >
              <div className={styles.title}>{hit.title}</div>
              <div className={styles.crumb}>{hit.slug}</div>
              {hit.excerpt && <div className={styles.excerpt}>{hit.excerpt}</div>}
            </li>
          ))}
          {query.trim() && hits.length === 0 && (
            <li className={styles.empty}>No matches.</li>
          )}
        </ul>
      </div>
    </div>
  )
}
