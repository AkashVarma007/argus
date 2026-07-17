import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import ClientView from '@/app/build/canvas/ClientView'
import { useBuildsStore } from '@/lib/store/builds'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: (key: string) => (key === 'id' ? 'BLD-missing' : null) }),
}))

beforeEach(() => {
  useBuildsStore.setState({ builds: {} })
})
afterEach(() => cleanup())

describe('Build page — not found', () => {
  it('renders EmptyState with link back to /build when build is missing', () => {
    render(<ClientView />)
    expect(screen.getByText(/build bld-missing not found/i)).toBeTruthy()
    const link = screen.getByRole('link', { name: /back to builds/i })
    expect(link.getAttribute('href')).toBe('/build')
  })
})
