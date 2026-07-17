'use client'
import { useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useSpecIndex } from '@/lib/learn/useSpecIndex'
import { LearnShell } from '@/components/learn/LearnShell'
import styles from './page.module.css'

function pickLandingSlug(entries: { slug: string }[], tree: { slug: string }[]): string | null {
  if (entries.some((e) => e.slug === 'index')) return 'index'
  if (entries.some((e) => e.slug === 'basic')) return 'basic'
  if (tree[0]) return tree[0].slug
  if (entries[0]) return entries[0].slug
  return null
}

export default function LearnIndexPage() {
  const router = useRouter()
  const { index, loading, error } = useSpecIndex()

  const landingSlug = useMemo(() => {
    if (!index) return null
    return pickLandingSlug(index.entries, index.tree)
  }, [index])

  const onNavigate = useCallback(
    (slug: string, anchor: string | null) => {
      const qs = anchor ? `?pulse=${encodeURIComponent(anchor)}` : ''
      const hash = anchor ? `#${anchor}` : ''
      router.push(`/learn/${slug}${qs}${hash}`)
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
  if (!index || !landingSlug) {
    return <section className={styles.status}>Empty spec index.</section>
  }

  return (
    <div className={styles.shell}>
      <LearnShell
        index={index}
        activeSlug={landingSlug}
        activeAnchor={null}
        onNavigate={onNavigate}
      />
    </div>
  )
}
