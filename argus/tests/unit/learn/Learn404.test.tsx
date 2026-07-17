import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import ClientView from '@/app/learn/[...slug]/ClientView'
import type { SpecIndex } from '@/lib/learn/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: () => null }),
}))

const INDEX: SpecIndex = {
  tree: [{ slug: 'index', title: 'Index', parentSlug: null, children: [] }],
  entries: [
    { slug: 'index', title: 'Index', excerpt: '', anchors: [], parentSlug: null },
  ],
  version: 'draft-2026-v1',
  generatedAt: new Date().toISOString(),
}

vi.mock('@/lib/learn/useSpecIndex', () => ({
  useSpecIndex: () => ({ index: INDEX, loading: false, error: null }),
}))

afterEach(() => cleanup())

describe('Learn page — 404', () => {
  it('renders EmptyState with link back to /learn when slug not in index', () => {
    render(<ClientView slug="does/not/exist" />)
    expect(screen.getByText(/section not found/i)).toBeTruthy()
    const link = screen.getByRole('link', { name: /back to spec index/i })
    expect(link.getAttribute('href')).toBe('/learn')
  })

  it('renders LearnShell when slug exists in index', () => {
    render(<ClientView slug="index" />)
    expect(screen.queryByText(/section not found/i)).toBeNull()
  })
})
