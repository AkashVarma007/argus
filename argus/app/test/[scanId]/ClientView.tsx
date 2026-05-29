// argus/app/test/[scanId]/ClientView.tsx
'use client'

import { useState } from 'react'
import styles from './page.module.css'
import { useScansStore } from '@/lib/store/scans'
import { GradeReveal } from '@/components/test/GradeReveal'
import { CategoryStrip } from '@/components/test/CategoryStrip'
import { CheckCard } from '@/components/test/CheckCard'
import { getCheck } from '@/lib/conformance/registry'

export default function ClientView({ scanId }: { scanId: string }) {
  const scan = useScansStore((s) => s.scans[scanId as any])
  const [category, setCategory] = useState<string | null>(null)
  if (!scan) {
    return <section className={styles.empty}>scan {scanId} not found</section>
  }
  const filtered = category ? scan.results.filter((r) => r.category === category) : scan.results
  return (
    <section className={styles.root}>
      <GradeReveal grade={scan.grade} summary={scan.summary} durationMs={scan.durationMs} />
      <div className={styles.split}>
        <aside className={styles.aside}>
          <CategoryStrip results={scan.results} selected={category} onSelect={setCategory} />
        </aside>
        <main className={styles.main}>
          {filtered.map((r) => {
            const meta = getCheck(r.checkId)
            return (
              <CheckCard
                key={r.checkId}
                result={r}
                title={meta?.title ?? r.checkId}
                specQuote={meta?.specRef.quote ?? ''}
              />
            )
          })}
        </main>
      </div>
    </section>
  )
}
