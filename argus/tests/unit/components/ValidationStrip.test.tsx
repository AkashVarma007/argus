import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { ValidationStrip } from '@/components/build/ValidationStrip'
import type { BuildIssue } from '@/lib/store/types'

describe('ValidationStrip', () => {
  it('renders empty-state message when no issues', () => {
    const { getByText } = render(<ValidationStrip issues={[]} />)
    expect(getByText('no issues — ready to generate')).toBeTruthy()
  })

  it('counts errors and warnings separately', () => {
    const issues: BuildIssue[] = [
      { severity: 'error', message: 'no server' },
      { severity: 'warning', message: 'missing description' },
      { severity: 'warning', message: 'not semver' },
    ]
    const { container } = render(<ValidationStrip issues={issues} />)
    const errorCount = container.querySelector('[data-severity="error"]')
    const warnCount = container.querySelector('[data-severity="warning"]')
    expect(errorCount?.textContent).toContain('1 error')
    expect(warnCount?.textContent).toContain('2 warnings')
  })

  it('invokes onFocus with the issue when an item is clicked', () => {
    const onFocus = vi.fn()
    const issue: BuildIssue = {
      severity: 'error',
      nodeId: 'n-2',
      message: 'duplicate tool name',
    }
    const { getByText } = render(<ValidationStrip issues={[issue]} onFocus={onFocus} />)
    fireEvent.click(getByText('duplicate tool name'))
    expect(onFocus).toHaveBeenCalledWith(issue)
  })
})
