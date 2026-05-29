// argus/tests/unit/test/TestIndexPage.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRouter } from 'next/navigation'

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('@/lib/conformance/runner', () => ({
  runScan: vi.fn(async (_checks, _ctx, { onProgress }) => {
    onProgress?.('start', { checkId: 'T-01' } as any)
    onProgress?.('pass', { checkId: 'T-01', status: 'pass', durationMs: 1 } as any)
    return { results: [{ checkId: 'T-01', status: 'pass', durationMs: 1 }], grade: 'A', durationMs: 5 }
  }),
}))

import TestIndexPage from '@/app/test/page'

describe('Test index page', () => {
  beforeEach(() => {
    ;(useRouter as any).mockReturnValue({ push: vi.fn() })
  })

  it('submits scan and renders progress', async () => {
    render(<TestIndexPage />)
    fireEvent.change(screen.getByLabelText(/endpoint/i), { target: { value: 'http://127.0.0.1:3845/mcp' } })
    fireEvent.click(screen.getByRole('button', { name: /run scan/i }))
    await waitFor(() => expect(screen.queryByLabelText('T-01')).not.toBeNull())
  })
})
