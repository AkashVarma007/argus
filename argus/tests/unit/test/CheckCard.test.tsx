// argus/tests/unit/test/CheckCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { CheckCard } from '@/components/test/CheckCard'

const failResult = {
  checkId: 'T-07', category: 'transport', severity: 'major' as const, status: 'fail' as const,
  durationMs: 12, observed: 'Server accepted disallowed Origin',
  expected: '403 Forbidden', specRef: 'https://example.com/spec', fixHint: undefined,
}

describe('CheckCard', () => {
  it('shows id and observed text', () => {
    render(<CheckCard result={failResult} title="Origin validation" specQuote="MUST validate Origin." />)
    expect(screen.getByText('T-07')).toBeTruthy()
    expect(screen.getByText(/Server accepted disallowed Origin/)).toBeTruthy()
  })

  it('expanded by default on fail; collapsed on pass', () => {
    const { rerender } = render(<CheckCard result={failResult} title="t" specQuote="q" />)
    expect(screen.getByText(/spec/i)).toBeTruthy()
    rerender(<CheckCard result={{ ...failResult, status: 'pass' }} title="t" specQuote="q" />)
    expect(screen.queryByText(/spec/i)).toBeNull()
  })

  it('toggles open on header click', () => {
    render(<CheckCard result={{ ...failResult, status: 'pass' }} title="t" specQuote="q" />)
    fireEvent.click(screen.getByText('T-07'))
    expect(screen.getByText(/spec/i)).toBeTruthy()
  })
})
