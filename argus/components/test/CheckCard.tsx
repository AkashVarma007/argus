// argus/components/test/CheckCard.tsx
'use client'

import { useState, useEffect } from 'react'
import styles from './CheckCard.module.css'
import type { CheckResult } from '@/lib/store/types'
import { useSpecIndex } from '@/lib/learn/useSpecIndex'
import { resolveSpecHref } from '@/lib/learn/href'

interface Props {
  result: CheckResult
  title: string
  specQuote: string
  curlCommand?: string
}

export function CheckCard({ result, title, specQuote, curlCommand }: Props) {
  const [open, setOpen] = useState(result.status === 'fail')
  useEffect(() => { setOpen(result.status === 'fail') }, [result.status])
  const { index } = useSpecIndex()
  const specHref =
    result.specRef && result.specRef.startsWith('spec://') && index
      ? resolveSpecHref(result.specRef, index)
      : null
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
              {specHref && (
                <a
                  href={specHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                  data-spec-link="true"
                  aria-label={`Open spec ${result.specRef}`}
                >
                  Open spec ↗
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
