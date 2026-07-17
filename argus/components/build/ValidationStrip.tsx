'use client'
import type { BuildIssue } from '@/lib/store/types'
import { useSpecIndex } from '@/lib/learn/useSpecIndex'
import { resolveSpecHref } from '@/lib/learn/href'
import styles from './ValidationStrip.module.css'

interface ValidationStripProps {
  issues: BuildIssue[]
  onFocus?: (issue: BuildIssue) => void
}

export function ValidationStrip({ issues, onFocus }: ValidationStripProps) {
  const errors = issues.filter((i) => i.severity === 'error').length
  const warnings = issues.filter((i) => i.severity === 'warning').length
  const { index } = useSpecIndex()
  function hrefFor(issue: BuildIssue): string | null {
    if (!issue.specRef || !issue.specRef.startsWith('spec://') || !index) return null
    return resolveSpecHref(issue.specRef, index)
  }

  return (
    <div data-argus="validation-strip" className={styles.root}>
      <div className={styles.summary}>
        <span className={styles.count} data-severity="error">
          {errors} error{errors === 1 ? '' : 's'}
        </span>
        <span className={styles.count} data-severity="warning">
          {warnings} warning{warnings === 1 ? '' : 's'}
        </span>
      </div>
      {issues.length === 0 ? (
        <div className={styles.empty}>no issues — ready to generate</div>
      ) : (
        <ul className={styles.list}>
          {issues.map((issue, i) => {
            const href = hrefFor(issue)
            return (
              <li key={i} className={styles.item}>
                <button
                  type="button"
                  className={styles.button}
                  data-severity={issue.severity}
                  onClick={() => onFocus?.(issue)}
                >
                  <span className={styles.badge}>{issue.severity}</span>
                  <span className={styles.target}>
                    {issue.nodeId ?? issue.edgeId ?? '—'}
                  </span>
                  <span className={styles.message}>{issue.message}</span>
                </button>
                {href && (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.specLink}
                    data-spec-link="true"
                    aria-label={`Open spec ${issue.specRef}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    spec ↗
                  </a>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
