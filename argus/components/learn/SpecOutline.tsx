'use client'
import type { SpecAnchor } from '@/lib/learn/types'
import styles from './SpecOutline.module.css'

interface SpecOutlineProps {
  anchors: SpecAnchor[]
  activeAnchorId: string | null
  onJump: (id: string) => void
  relatedChecks?: { id: string; label: string }[]
}

export function SpecOutline({
  anchors,
  activeAnchorId,
  onJump,
  relatedChecks,
}: SpecOutlineProps) {
  const visible = anchors.filter((a) => a.level === 2 || a.level === 3)

  return (
    <aside data-argus="spec-outline" className={styles.root} aria-label="On this page">
      <div className={styles.head}>ON PAGE</div>
      {visible.length === 0 ? (
        <p className={styles.empty}>No sections.</p>
      ) : (
        <ul className={styles.list}>
          {visible.map((a) => {
            const isActive = a.id === activeAnchorId
            const className = [
              styles.item,
              a.level === 3 ? styles.itemDeep : '',
              isActive ? styles.active : '',
            ]
              .filter(Boolean)
              .join(' ')
            return (
              <li key={a.id}>
                <button
                  type="button"
                  data-anchor-id={a.id}
                  data-level={a.level}
                  data-active={isActive ? 'true' : undefined}
                  className={className}
                  onClick={() => onJump(a.id)}
                >
                  {a.text}
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {relatedChecks && relatedChecks.length > 0 && (
        <>
          <div className={styles.subhead}>CHECKS</div>
          <ul className={styles.list}>
            {relatedChecks.map((c) => (
              <li key={c.id}>
                <span className={styles.check} data-check-id={c.id}>
                  {c.label}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  )
}
