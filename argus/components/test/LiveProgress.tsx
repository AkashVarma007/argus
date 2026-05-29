'use client'

import styles from './LiveProgress.module.css'
import type { CheckStatus } from '@/lib/store/types'

interface Props {
  checkIds: string[]
  statuses: Record<string, CheckStatus | 'running'>
}

export function LiveProgress({ checkIds, statuses }: Props) {
  return (
    <ol className={styles.strip} data-argus="live-progress">
      {checkIds.map((id) => (
        <li
          key={id}
          aria-label={id}
          title={id}
          className={styles.cell}
          data-status={statuses[id] ?? 'pending'}
        />
      ))}
    </ol>
  )
}
