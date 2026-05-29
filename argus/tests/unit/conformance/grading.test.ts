import { describe, it, expect } from 'vitest'
import { computeGrade, summarize } from '@/lib/conformance/grading'
import type { CheckResult } from '@/lib/conformance/types'

const r = (id: string, status: CheckResult['status']): CheckResult => ({
  checkId: id, status, durationMs: 1,
})

describe('grading', () => {
  it('A+ when 100% error-severity checks pass and zero warnings', () => {
    const grade = computeGrade({ errorPass: 50, errorTotal: 50, warningPass: 10, warningTotal: 10 })
    expect(grade).toBe('A+')
  })

  it('A when >=98% error passes', () => {
    expect(computeGrade({ errorPass: 49, errorTotal: 50, warningPass: 10, warningTotal: 10 })).toBe('A')
  })

  it('B+ at 90%', () => {
    expect(computeGrade({ errorPass: 90, errorTotal: 100, warningPass: 10, warningTotal: 10 })).toBe('B+')
  })

  it('C at 75%', () => {
    expect(computeGrade({ errorPass: 75, errorTotal: 100, warningPass: 0, warningTotal: 10 })).toBe('C')
  })

  it('F at 0%', () => {
    expect(computeGrade({ errorPass: 0, errorTotal: 50, warningPass: 0, warningTotal: 10 })).toBe('F')
  })

  it('summarize counts pass/fail/skip/error', () => {
    const results: CheckResult[] = [
      r('a', 'pass'), r('b', 'pass'), r('c', 'fail'),
      r('d', 'skip'), r('e', 'error'),
    ]
    expect(summarize(results)).toEqual({ pass: 2, fail: 1, skip: 1, error: 1 })
  })
})
