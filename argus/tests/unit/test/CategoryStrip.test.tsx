// argus/tests/unit/test/CategoryStrip.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { CategoryStrip } from '@/components/test/CategoryStrip'
import type { CheckResult } from '@/lib/store/types'

const results: CheckResult[] = [
  { checkId: 'T-01', category: 'transport', severity: 'major', status: 'pass', durationMs: 5 },
  { checkId: 'T-07', category: 'transport', severity: 'major', status: 'fail', durationMs: 5 },
  { checkId: 'J-01', category: 'jsonrpc', severity: 'major', status: 'pass', durationMs: 5 },
]

describe('CategoryStrip', () => {
  it('renders one row per category present', () => {
    render(<CategoryStrip results={results} onSelect={() => {}} selected={null} />)
    expect(screen.getByText(/transport/i)).toBeTruthy()
    expect(screen.getByText(/jsonrpc/i)).toBeTruthy()
  })

  it('calls onSelect with category id when row clicked', () => {
    const onSelect = vi.fn()
    render(<CategoryStrip results={results} onSelect={onSelect} selected={null} />)
    fireEvent.click(screen.getByText(/transport/i))
    expect(onSelect).toHaveBeenCalledWith('transport')
  })
})
