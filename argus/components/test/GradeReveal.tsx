// argus/components/test/GradeReveal.tsx
import styles from './GradeReveal.module.css'
import type { Grade } from '@/lib/store/types'

interface Props {
  grade: Grade
  summary: { pass: number; fail: number; skip: number; error: number }
  durationMs: number
}

export function GradeReveal({ grade, summary, durationMs }: Props) {
  const total = summary.pass + summary.fail + summary.skip + summary.error
  return (
    <div className={styles.root} data-grade={grade} data-argus="grade-reveal">
      <div className={styles.letter}>{grade}</div>
      <dl className={styles.summary}>
        <div><dt>pass</dt><dd>{summary.pass} / {total}</dd></div>
        <div><dt>fail</dt><dd>{summary.fail}</dd></div>
        <div><dt>skip</dt><dd>{summary.skip}</dd></div>
        <div><dt>error</dt><dd>{summary.error}</dd></div>
        <div><dt>duration</dt><dd>{(durationMs / 1000).toFixed(1)}s</dd></div>
      </dl>
    </div>
  )
}
