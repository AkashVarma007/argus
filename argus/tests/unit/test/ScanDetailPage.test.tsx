// argus/tests/unit/test/ScanDetailPage.test.tsx
import { render, screen, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useScansStore } from '@/lib/store/scans'
import ClientView from '@/app/test/scan/ClientView'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => ({ get: (key: string) => (key === 'id' ? 'SCN-XYZ' : null) }),
}))

describe('Scan detail page', () => {
  beforeEach(() => {
    localStorage.clear()
    useScansStore.setState({ scans: {} })
    useScansStore.getState().addScan({
      id: 'SCN-XYZ' as never,
      startedAt: '2026-05-27T10:00:00Z',
      endpoint: 'http://x', transport: 'http', spec: 'draft-2026-v1',
      durationMs: 1234, grade: 'B+',
      summary: { pass: 5, fail: 1, skip: 0, error: 0 },
      results: [
        { checkId: 'T-01', category: 'transport', severity: 'major', status: 'pass', durationMs: 5 },
        { checkId: 'T-07', category: 'transport', severity: 'major', status: 'fail', durationMs: 5, observed: 'accepted bad origin' },
      ],
    })
  })
  afterEach(() => cleanup())

  it('renders grade and check rows', () => {
    render(<ClientView />)
    expect(screen.getByText('B+')).toBeTruthy()
    expect(screen.getByText('T-07')).toBeTruthy()
  })
})
