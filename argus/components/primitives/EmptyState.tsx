import Link from 'next/link'
import type { Route } from 'next'
import styles from './EmptyState.module.css'

interface EmptyStateProps {
  heading: string
  description: string
  ctaLabel?: string
  ctaHref?: string
}

export function EmptyState({ heading, description, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <div className={styles.root} data-argus="empty-state">
      <h3 className={styles.heading}>{heading}</h3>
      <p className={styles.description}>{description}</p>
      {ctaLabel && ctaHref && (
        <Link href={ctaHref as Route} className={styles.cta}>
          {ctaLabel}
        </Link>
      )}
    </div>
  )
}
