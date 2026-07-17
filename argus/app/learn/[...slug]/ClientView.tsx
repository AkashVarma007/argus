'use client'
import { useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSpecIndex } from '@/lib/learn/useSpecIndex'
import { LearnShell } from '@/components/learn/LearnShell'
import { EmptyState } from '@/components/primitives/EmptyState'
import type { SpecIndex } from '@/lib/learn/types'
import styles from '../page.module.css'

function indexHasSlug(index: SpecIndex, slug: string): boolean {
  return index.entries.some((e) => e.slug === slug)
}

interface ClientViewProps {
  slug: string
}

export default function ClientView({ slug }: ClientViewProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { index, loading, error } = useSpecIndex()

  const pulse = searchParams?.get('pulse') ?? null
  const anchorQuery = searchParams?.get('anchor') ?? null
  const activeAnchor = pulse ?? anchorQuery

  const onNavigate = useCallback(
    (nextSlug: string, nextAnchor: string | null) => {
      const qs = nextAnchor ? `?pulse=${encodeURIComponent(nextAnchor)}` : ''
      const hash = nextAnchor ? `#${nextAnchor}` : ''
      router.push(`/learn/${nextSlug}${qs}${hash}`)
    },
    [router],
  )

  if (loading) {
    return <section className={styles.status}>Loading spec index...</section>
  }
  if (error) {
    return (
      <section className={styles.status}>
        <p>Spec index not available.</p>
        <p className={styles.hint}>
          Run <code>pnpm sync-spec</code> to vendor the spec into{' '}
          <code>public/spec-source/</code>.
        </p>
        <p className={styles.error}>Error: {error}</p>
      </section>
    )
  }
  if (!index) {
    return <section className={styles.status}>Empty spec index.</section>
  }

  if (!indexHasSlug(index, slug)) {
    return (
      <section className={styles.status} data-argus="learn-404">
        <EmptyState
          heading={`Section not found: ${slug}`}
          description="That spec path doesn't exist in the current draft. Pick a section from the index."
          ctaLabel="Back to spec index"
          ctaHref="/learn"
        />
      </section>
    )
  }

  return (
    <div className={styles.shell}>
      <LearnShell
        index={index}
        activeSlug={slug}
        activeAnchor={activeAnchor}
        onNavigate={onNavigate}
      />
    </div>
  )
}
