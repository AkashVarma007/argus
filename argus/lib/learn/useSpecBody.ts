'use client'
import { useEffect, useState } from 'react'

export interface UseSpecBodyResult {
  body: string | null
  loading: boolean
  error: string | null
}

const BASE = '/spec-source/draft-2026-v1'
const cache = new Map<string, string>()
const inflight = new Map<string, Promise<string>>()

function fetchBody(slug: string): Promise<string> {
  const cached = cache.get(slug)
  if (cached !== undefined) return Promise.resolve(cached)
  const existing = inflight.get(slug)
  if (existing) return existing
  const p = fetch(`${BASE}/${slug}.md`)
    .then((r) => {
      if (!r.ok) throw new Error(`spec body ${slug}: ${r.status}`)
      return r.text()
    })
    .then((text) => {
      cache.set(slug, text)
      inflight.delete(slug)
      return text
    })
    .catch((err) => {
      inflight.delete(slug)
      throw err
    })
  inflight.set(slug, p)
  return p
}

export function useSpecBody(slug: string | null): UseSpecBodyResult {
  const [body, setBody] = useState<string | null>(
    slug ? cache.get(slug) ?? null : null,
  )
  const [loading, setLoading] = useState<boolean>(!!slug && !cache.has(slug))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setBody(null)
      setLoading(false)
      setError(null)
      return
    }
    const cached = cache.get(slug)
    if (cached !== undefined) {
      setBody(cached)
      setLoading(false)
      setError(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setBody(null)
    setError(null)
    fetchBody(slug)
      .then((text) => {
        if (cancelled) return
        setBody(text)
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
  }, [slug])

  return { body, loading, error }
}

export function _resetSpecBodyForTests(): void {
  cache.clear()
  inflight.clear()
}
