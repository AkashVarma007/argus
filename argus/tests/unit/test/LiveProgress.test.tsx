// argus/tests/unit/test/LiveProgress.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LiveProgress } from '@/components/test/LiveProgress'

describe('LiveProgress', () => {
  it('renders one cell per check id', () => {
    render(<LiveProgress checkIds={['T-01', 'T-03', 'J-01']} statuses={{}} />)
    expect(screen.getAllByRole('listitem')).toHaveLength(3)
  })

  it('applies status data attribute', () => {
    render(<LiveProgress checkIds={['T-01']} statuses={{ 'T-01': 'pass' }} />)
    expect(screen.getByLabelText('T-01').getAttribute('data-status')).toBe('pass')
  })

  it('shows pending for unreported checks', () => {
    render(<LiveProgress checkIds={['T-01']} statuses={{}} />)
    expect(screen.getByLabelText('T-01').getAttribute('data-status')).toBe('pending')
  })
})
