'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import styles from './page.module.css'
import { useScansStore } from '@/lib/store/scans'
import { GradeReveal } from '@/components/test/GradeReveal'
import { CategoryStrip } from '@/components/test/CategoryStrip'
import { ResultsByCategory } from '@/components/test/ResultsByCategory'
import { EmptyState } from '@/components/primitives/EmptyState'
import type { CheckResult } from '@/lib/store/types'

export default function ClientView() {
  const searchParams = useSearchParams()
  const scanId = searchParams.get('id') ?? ''
  const scan = useScansStore((s) => s.scans[scanId as never])
  const [category, setCategory] = useState<string | null>(null)
  if (!scan) {
    return (
      <section className={styles.empty} data-argus="scan-missing">
        <EmptyState
          heading={scanId ? `Scan ${scanId} not found` : 'No scan selected'}
          description="This scan may have been deleted, or the link is stale. Run a new scan or open a recent one from the home page."
          ctaLabel="Run a new scan"
          ctaHref="/test"
        />
      </section>
    )
  }
  const filtered: CheckResult[] = category
    ? scan.results.filter((r) => r.category === category)
    : scan.results
  return (
    <section className={styles.root}>
      <GradeReveal grade={scan.grade} summary={scan.summary} durationMs={scan.durationMs} />
      <div className={styles.split}>
        <aside className={styles.aside}>
          <CategoryStrip results={scan.results} selected={category} onSelect={setCategory} />
        </aside>
        <main className={styles.main}>
          <ResultsByCategory
            results={filtered}
            defaultExpand={(_cat, items) => items.some((r) => r.status === 'fail')}
          />
        </main>
      </div>
    </section>
  )
}
