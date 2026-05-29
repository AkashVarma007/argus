// argus/components/test/RawProtocolLog.tsx
'use client'

import { useState } from 'react'
import styles from './RawProtocolLog.module.css'

export interface LogEntry {
  ts: number
  direction: 'in' | 'out'
  payload: unknown
}

interface Props { entries: LogEntry[] }

function summarize(entry: LogEntry): string {
  const p = entry.payload as any
  if (p?.method) return `${p.method}${p.id !== undefined ? ` (id=${p.id})` : ''}`
  if (p?.result) return `result (id=${p.id})`
  if (p?.error) return `error ${p.error?.code} (id=${p.id})`
  return '(unknown)'
}

export function RawProtocolLog({ entries }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  return (
    <ol className={styles.log} data-argus="raw-log">
      {entries.map((e, i) => (
        <li key={i} className={styles.entry}>
          <div className={styles.head} onClick={() => setOpenIdx(openIdx === i ? null : i)}>
            <span className={styles.dir} data-dir={e.direction}>{e.direction === 'out' ? '→' : '←'}</span>
            <span className={styles.ts}>{e.ts}</span>
            <span className={styles.summary}>{summarize(e)}</span>
          </div>
          {openIdx === i && (
            <pre className={styles.json}>{JSON.stringify(e.payload, null, 2)}</pre>
          )}
        </li>
      ))}
    </ol>
  )
}
