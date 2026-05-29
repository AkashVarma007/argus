import type { Grade } from '../store/types'
import type { CheckResult } from './types'

export interface GradeInput {
  errorPass: number
  errorTotal: number
  warningPass: number
  warningTotal: number
}

export function computeGrade({ errorPass, errorTotal, warningPass, warningTotal }: GradeInput): Grade {
  if (errorTotal === 0) return 'A+'
  const ratio = errorPass / errorTotal
  const warnRatio = warningTotal === 0 ? 1 : warningPass / warningTotal
  if (ratio === 1 && warnRatio === 1) return 'A+'
  if (ratio >= 0.98) return 'A'
  if (ratio >= 0.95) return 'A-'
  if (ratio >= 0.90) return 'B+'
  if (ratio >= 0.85) return 'B'
  if (ratio >= 0.80) return 'B-'
  if (ratio > 0.75) return 'C+'
  if (ratio >= 0.70) return 'C'
  if (ratio >= 0.60) return 'C-'
  if (ratio >= 0.50) return 'D'
  return 'F'
}

export interface CountSummary { pass: number; fail: number; skip: number; error: number }

export function summarize(results: CheckResult[]): CountSummary {
  const s: CountSummary = { pass: 0, fail: 0, skip: 0, error: 0 }
  for (const r of results) s[r.status] += 1
  return s
}
