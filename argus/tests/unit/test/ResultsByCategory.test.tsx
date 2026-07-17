import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ResultsByCategory } from '@/components/test/ResultsByCategory'
import { usePrefsStore } from '@/lib/store/prefs'
import type { CheckResult } from '@/lib/store/types'

function mkResult(id: string, category: string, status: 'pass' | 'fail' = 'pass'): CheckResult {
  return {
    checkId: id as CheckResult['checkId'],
    category,
    severity: 'major',
    status,
    durationMs: 1,
  } as CheckResult
}

beforeEach(() => {
  usePrefsStore.setState({ expandedCategories: {} })
})
afterEach(() => cleanup())

describe('ResultsByCategory', () => {
  it('renders only category headers when nothing is expanded', () => {
    const results = [
      mkResult('T-01', 'transport'),
      mkResult('JR-01', 'jsonrpc'),
      mkResult('T-07', 'transport', 'fail'),
    ]
    render(<ResultsByCategory results={results} />)
    expect(screen.getByText('transport')).toBeTruthy()
    expect(screen.getByText('jsonrpc')).toBeTruthy()
    expect(screen.queryByText('T-01')).toBeNull()
    expect(screen.queryByText('T-07')).toBeNull()
    expect(screen.queryByText('JR-01')).toBeNull()
  })

  it('clicking the header expands that group only', () => {
    const results = [mkResult('T-01', 'transport'), mkResult('JR-01', 'jsonrpc')]
    render(<ResultsByCategory results={results} />)
    fireEvent.click(screen.getByText('transport'))
    expect(screen.getByText('T-01')).toBeTruthy()
    expect(screen.queryByText('JR-01')).toBeNull()
  })

  it('persists expand state to prefs store', () => {
    const results = [mkResult('T-01', 'transport')]
    render(<ResultsByCategory results={results} />)
    fireEvent.click(screen.getByText('transport'))
    expect(usePrefsStore.getState().expandedCategories.transport).toBe(true)
    fireEvent.click(screen.getByText('transport'))
    expect(usePrefsStore.getState().expandedCategories.transport).toBe(false)
  })

  it('defaultExpand opens categories matching the predicate', () => {
    const results = [
      mkResult('T-01', 'transport'),
      mkResult('T-07', 'transport', 'fail'),
      mkResult('JR-01', 'jsonrpc'),
    ]
    render(
      <ResultsByCategory
        results={results}
        defaultExpand={(_c, items) => items.some((r) => r.status === 'fail')}
      />,
    )
    expect(screen.getByText('T-01')).toBeTruthy()
    expect(screen.getByText('T-07')).toBeTruthy()
    expect(screen.queryByText('JR-01')).toBeNull()
  })

  it('manual toggle overrides defaultExpand', () => {
    const results = [
      mkResult('T-01', 'transport'),
      mkResult('T-07', 'transport', 'fail'),
    ]
    render(
      <ResultsByCategory
        results={results}
        defaultExpand={() => true}
      />,
    )
    fireEvent.click(screen.getByText('transport'))
    expect(screen.queryByText('T-01')).toBeNull()
  })
})
