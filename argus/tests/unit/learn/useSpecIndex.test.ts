import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useSpecIndex, _resetSpecIndexForTests } from '@/lib/learn/useSpecIndex'
import type { SpecIndex } from '@/lib/learn/types'

const fakeIndex: SpecIndex = {
  version: 'draft-2026-v1',
  generatedAt: '2026-05-29T00:00:00.000Z',
  tree: [],
  entries: [],
}

beforeEach(() => {
  _resetSpecIndexForTests()
})

describe('useSpecIndex', () => {
  it('fetches and returns the index', async () => {
    const fetchSpy = vi.fn(
      async () =>
        new Response(JSON.stringify(fakeIndex), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchSpy)

    const { result } = renderHook(() => useSpecIndex())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.index).toEqual(fakeIndex)
    expect(result.current.error).toBeNull()
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })

  it('reports error on failed fetch', async () => {
    const fetchSpy = vi.fn(async () => new Response('', { status: 500 }))
    vi.stubGlobal('fetch', fetchSpy)

    const { result } = renderHook(() => useSpecIndex())
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.error).toContain('500')
  })

  it('caches the index across calls', async () => {
    const fetchSpy = vi.fn(
      async () =>
        new Response(JSON.stringify(fakeIndex), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchSpy)

    const a = renderHook(() => useSpecIndex())
    await waitFor(() => expect(a.result.current.loading).toBe(false))
    const b = renderHook(() => useSpecIndex())
    await waitFor(() => expect(b.result.current.loading).toBe(false))
    expect(fetchSpy).toHaveBeenCalledTimes(1)
  })
})
