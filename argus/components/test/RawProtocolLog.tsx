// argus/components/test/RawProtocolLog.tsx
'use client'

import { useEffect, useState } from 'react'
import styles from './RawProtocolLog.module.css'

export interface LogEntry {
  ts: number
  direction: 'in' | 'out'
  payload: unknown
}

interface Props { entries: LogEntry[]; pageSize?: number }

const DEFAULT_PAGE = 200

function summarize(entry: LogEntry): string {
  const p = entry.payload as any
  if (p?.method) return `${p.method}${p.id !== undefined ? ` (id=${p.id})` : ''}`
  if (p?.result) return `result (id=${p.id})`
  if (p?.error) return `error ${p.error?.code} (id=${p.id})`
  return '(unknown)'
}

export function RawProtocolLog({ entries, pageSize = DEFAULT_PAGE }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)
  const [visible, setVisible] = useState(pageSize)

  useEffect(() => {
    setVisible(pageSize)
  }, [pageSize])

  const total = entries.length
  const start = Math.max(0, total - visible)
  const window = entries.slice(start)
  const hidden = total - window.length

  return (
    <div data-argus="raw-log">
      {hidden > 0 && (
        <button
          type="button"
          className={styles.loadMore}
          onClick={() => setVisible((n) => n + pageSize)}
          data-argus="raw-log-load-earlier"
        >
          Load {Math.min(hidden, pageSize)} earlier frames ({hidden} hidden)
        </button>
      )}
      <ol className={styles.log} start={start + 1}>
        {window.map((e, localI) => {
          const i = start + localI
          return (
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
          )
        })}
      </ol>
    </div>
  )
}
