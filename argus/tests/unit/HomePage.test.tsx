import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import HomePage from '@/app/page'
import { useScansStore } from '@/lib/store/scans'
import { useBuildsStore } from '@/lib/store/builds'
import type { Scan, Build } from '@/lib/store/types'

beforeEach(() => {
  useScansStore.setState({ scans: {} })
  useBuildsStore.setState({ builds: {} })
})

afterEach(() => cleanup())

describe('HomePage', () => {
  it('shows empty states when no scans and no builds', () => {
    render(<HomePage />)
    expect(screen.getByText(/no scans yet/i)).toBeTruthy()
    expect(screen.getByText(/no builds yet/i)).toBeTruthy()
    expect(screen.getByRole('link', { name: /start a scan/i }).getAttribute('href')).toBe('/test')
    expect(screen.getByRole('link', { name: /start a build/i }).getAttribute('href')).toBe('/build')
  })

  it('lists recent scans when present', () => {
    const scan = {
      id: 'SCN-1' as Scan['id'],
      startedAt: new Date().toISOString(),
      endpoint: 'http://x',
      transport: 'http',
      spec: 'draft-2026-v1',
      durationMs: 100,
      grade: 'A',
      summary: { pass: 1, fail: 0, skip: 0, error: 0 },
      results: [],
    } as unknown as Scan
    useScansStore.setState({ scans: { [scan.id]: scan } })
    render(<HomePage />)
    expect(screen.queryByText(/no scans yet/i)).toBeNull()
    expect(screen.getByText(/SCN-1/)).toBeTruthy()
  })

  it('lists recent builds when present', () => {
    const build = {
      id: 'BLD-1' as Build['id'],
      name: 'demo',
      language: 'typescript',
      modifiedAt: new Date().toISOString(),
      packageMeta: { name: 'demo' },
      nodes: [],
      edges: [],
    } as unknown as Build
    useBuildsStore.setState({ builds: { [build.id]: build } })
    render(<HomePage />)
    expect(screen.queryByText(/no builds yet/i)).toBeNull()
    expect(screen.getByText(/BLD-1/)).toBeTruthy()
  })
})
