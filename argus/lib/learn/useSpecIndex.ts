'use client'
import { useEffect, useState } from 'react'
import type { SpecIndex } from './types'

export interface UseSpecIndexResult {
  index: SpecIndex | null
  loading: boolean
  error: string | null
}

const SOURCE = '/spec-source/draft-2026-v1/spec-index.json'

let cached: SpecIndex | null = null
let pending: Promise<SpecIndex> | null = null

function fetchOnce(): Promise<SpecIndex> {
  if (cached) return Promise.resolve(cached)
  if (pending) return pending
  pending = fetch(SOURCE)
    .then((r) => {
      if (!r.ok) throw new Error(`spec-index: ${r.status}`)
      return r.json() as Promise<SpecIndex>
    })
    .then((idx) => {
      cached = idx
      pending = null
      return idx
    })
    .catch((err) => {
      pending = null
      throw err
    })
  return pending
}

export function useSpecIndex(): UseSpecIndexResult {
  const [index, setIndex] = useState<SpecIndex | null>(cached)
  const [loading, setLoading] = useState<boolean>(!cached)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (cached) return
    let cancelled = false
    fetchOnce()
      .then((idx) => {
        if (cancelled) return
        setIndex(idx)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : String(err))
        setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { index, loading, error }
}

export function _resetSpecIndexForTests(): void {
  cached = null
  pending = null
}
