// argus/tests/unit/test/GradeReveal.test.tsx
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { GradeReveal } from '@/components/test/GradeReveal'

describe('GradeReveal', () => {
  it('shows grade letter', () => {
    render(<GradeReveal grade="B+" summary={{ pass: 50, fail: 10, skip: 5, error: 0 }} durationMs={1234} />)
    expect(screen.getByText('B+')).toBeTruthy()
  })

  it('shows summary counts', () => {
    render(<GradeReveal grade="A" summary={{ pass: 60, fail: 0, skip: 0, error: 0 }} durationMs={500} />)
    expect(screen.getByText(/60/)).toBeTruthy()
  })
})
