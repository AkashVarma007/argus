import type { ReactNode } from 'react'
import styles from './Panel.module.css'

interface PanelProps {
  children: ReactNode
  title?: string
  elevated?: boolean
  className?: string
}

export function Panel({ children, title, elevated, className }: PanelProps) {
  return (
    <div
      data-argus="panel"
      data-elevated={elevated ? 'true' : undefined}
      aria-label={title}
      className={[styles.root, className].filter(Boolean).join(' ')}
    >
      {title && <div className={styles.title}>{title}</div>}
      {children}
    </div>
  )
}
