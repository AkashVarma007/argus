import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSpecBody, _resetSpecBodyForTests } from '@/lib/learn/useSpecBody'

beforeEach(() => {
  _resetSpecBodyForTests()
})

describe('useSpecBody', () => {
  it('returns null when slug is null', () => {
    vi.stubGlobal('fetch', vi.fn())
    const { result } = renderHook(() => useSpecBody(null))
    expect(result.current.body).toBeNull()
    expect(result.current.loading).toBe(false)
  })

  it('fetches body for slug', async () => {
    const fetchSpy = vi.fn(async () => new Response('# Hello', { status: 200 }))
    vi.stubGlobal('fetch', fetchSpy)
    const { result } = renderHook(() => useSpecBody('basic/transports'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.body).toBe('# Hello')
    expect(fetchSpy).toHaveBeenCalledWith(
      '/spec-source/draft-2026-v1/basic/transports.md',
    )
  })

  it('caches across calls for same slug', async () => {
    const fetchSpy = vi.fn(async () => new Response('# Cached', { status: 200 }))
    vi.stubGlobal('fetch', fetchSpy)
    const a = renderHook(() => useSpecBody('basic/lifecycle'))
    await waitFor(() => expect(a.result.current.loading).toBe(false))
    const b = renderHook(() => useSpecBody('basic/lifecycle'))
    await waitFor(() => expect(b.result.current.body).toBe('# Cached'))
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('reports error on 404', async () => {
    const fetchSpy = vi.fn(async () => new Response('', { status: 404 }))
    vi.stubGlobal('fetch', fetchSpy)
    const { result } = renderHook(() => useSpecBody('missing'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toContain('404')
  })
})
