import type { CheckResult as EngineCheckResult, Check } from './types'
import type { CheckResult as StoreCheckResult, Severity as StoreSeverity } from '@/lib/store/types'

const SEVERITY_MAP: Record<Check['severity'], StoreSeverity> = {
  error: 'major',
  warning: 'minor',
  info: 'info',
}

function stringifyActual(v: unknown): string {
  if (v === undefined || v === null) return ''
  if (typeof v === 'string') return v
  try {
    const s = JSON.stringify(v)
    return typeof s === 'string' ? s : String(v)
  } catch {
    return String(v)
  }
}

export function toStoreResult(result: EngineCheckResult, check: Check): StoreCheckResult {
  const notes = result.evidence?.notes
  return {
    checkId: result.checkId,
    category: check.category,
    severity: SEVERITY_MAP[check.severity],
    status: result.status,
    durationMs: result.durationMs,
    observed: result.evidence?.actual !== undefined
      ? stringifyActual(result.evidence.actual)
      : (result.message ?? ''),
    expected: stringifyActual(result.evidence?.expected),
    specRef: check.specRef.url,
    fixHint: notes && notes.length > 0 ? notes.join('; ') : undefined,
  }
}
