import type { Check, CheckContext, CheckResult, CheckStatus } from './types'
import { summarize, computeGrade } from './grading'
import type { Grade } from '../store/types'

export interface RunnerOptions {
  signal?: AbortSignal
  onProgress?: (checkId: string, status: 'start' | CheckStatus, result?: CheckResult) => void
}

export interface ScanReport {
  results: CheckResult[]
  grade: Grade
  summary: { pass: number; fail: number; skip: number; error: number }
  durationMs: number
}

function appliesToSpec(check: Check, spec: string): boolean {
  return check.appliesTo.includes(spec as never)
}

function requiresMet(check: Check, caps: CheckContext['capabilities']): boolean {
  if (!check.requires) return true
  return check.requires.every((r) => (caps as Record<string, unknown>)[r] !== undefined)
}

export async function runScan(
  checks: readonly Check[],
  ctx: CheckContext,
  opts: RunnerOptions = {},
): Promise<ScanReport> {
  const start = performance.now()
  const results: CheckResult[] = []
  let aborted = false

  for (const c of checks) {
    if (opts.signal?.aborted) aborted = true
    if (aborted) {
      const r: CheckResult = { checkId: c.id, status: 'skip', message: 'aborted', durationMs: 0 }
      results.push(r)
      opts.onProgress?.(c.id, 'skip', r)
      continue
    }
    if (!appliesToSpec(c, ctx.spec)) {
      const r: CheckResult = { checkId: c.id, status: 'skip', message: `does not apply to ${ctx.spec}`, durationMs: 0 }
      results.push(r)
      opts.onProgress?.(c.id, 'skip', r)
      continue
    }
    if (!requiresMet(c, ctx.capabilities)) {
      const r: CheckResult = { checkId: c.id, status: 'skip', message: `missing capability: ${c.requires?.join(',')}`, durationMs: 0 }
      results.push(r)
      opts.onProgress?.(c.id, 'skip', r)
      continue
    }
    opts.onProgress?.(c.id, 'start')
    const tStart = performance.now()
    try {
      const result = await c.run(ctx)
      const durationMs = result.durationMs ?? performance.now() - tStart
      const finalized: CheckResult = { ...result, durationMs }
      results.push(finalized)
      opts.onProgress?.(c.id, finalized.status, finalized)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      const r: CheckResult = { checkId: c.id, status: 'error', message, durationMs: performance.now() - tStart }
      results.push(r)
      opts.onProgress?.(c.id, 'error', r)
    }
  }

  const summary = summarize(results)
  const errorIds = new Set(checks.filter((c) => c.severity === 'error').map((c) => c.id))
  const errorResults = results.filter((r) => errorIds.has(r.checkId) && r.status !== 'skip')
  const errorPass = errorResults.filter((r) => r.status === 'pass').length
  const errorTotal = errorResults.length
  const warnIds = new Set(checks.filter((c) => c.severity === 'warning').map((c) => c.id))
  const warnResults = results.filter((r) => warnIds.has(r.checkId) && r.status !== 'skip')
  const warningPass = warnResults.filter((r) => r.status === 'pass').length
  const warningTotal = warnResults.length

  return {
    results,
    grade: computeGrade({ errorPass, errorTotal, warningPass, warningTotal }),
    summary,
    durationMs: performance.now() - start,
  }
}
