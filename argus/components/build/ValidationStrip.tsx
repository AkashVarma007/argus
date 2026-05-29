import type { BuildIssue } from '@/lib/store/types'
import styles from './ValidationStrip.module.css'

interface ValidationStripProps {
  issues: BuildIssue[]
  onFocus?: (issue: BuildIssue) => void
}

export function ValidationStrip({ issues, onFocus }: ValidationStripProps) {
  const errors = issues.filter((i) => i.severity === 'error').length
  const warnings = issues.filter((i) => i.severity === 'warning').length

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
          {issues.map((issue, i) => (
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
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
