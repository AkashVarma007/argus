// argus/components/test/CheckCard.tsx
'use client'

import { useState, useEffect } from 'react'
import styles from './CheckCard.module.css'
import type { CheckResult } from '@/lib/store/types'

interface Props {
  result: CheckResult
  title: string
  specQuote: string
  curlCommand?: string
}

export function CheckCard({ result, title, specQuote, curlCommand }: Props) {
  const [open, setOpen] = useState(result.status === 'fail')
  useEffect(() => { setOpen(result.status === 'fail') }, [result.status])
  return (
    <article className={styles.card} data-status={result.status}>
      <header className={styles.header} onClick={() => setOpen((v) => !v)}>
        <span className={styles.id}>{result.checkId}</span>
        <span className={styles.title}>{title}</span>
        <span className={styles.status}>{result.status}</span>
      </header>
      {open && (
        <div className={styles.body}>
          {result.expected && (
            <div className={styles.row}>
              <span className={styles.label}>expected</span>
              <code>{result.expected}</code>
            </div>
          )}
          {result.observed && (
            <div className={styles.row}>
              <span className={styles.label}>observed</span>
              <code>{result.observed}</code>
            </div>
          )}
          {specQuote && (
            <div className={styles.row}>
              <span className={styles.label}>spec</span>
              <blockquote>{specQuote}</blockquote>
              {result.specRef && (
                <a href={result.specRef} target="_blank" rel="noreferrer" className={styles.link} aria-label={result.specRef}>
                  ↗
                </a>
              )}
            </div>
          )}
          {curlCommand && (
            <div className={styles.row}>
              <span className={styles.label}>repro</span>
              <pre className={styles.curl}>{curlCommand}</pre>
            </div>
          )}
          {result.fixHint && (
            <div className={styles.row}>
              <span className={styles.label}>fix</span>
              <code>{result.fixHint}</code>
            </div>
          )}
        </div>
      )}
    </article>
  )
}
