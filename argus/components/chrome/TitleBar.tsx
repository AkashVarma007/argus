import { LiveDot } from '@/components/primitives/LiveDot'
import { Mark } from '@/components/lattice/Mark'
import styles from './TitleBar.module.css'

interface TitleBarProps {
  version: string
  storageUsed?: string
}

export function TitleBar({ version, storageUsed = 'localStorage · 0 KB' }: TitleBarProps) {
  return (
    <header className={styles.root}>
      <div className={styles.brand}>
        <Mark size={14} />
        <span className={styles.word}>argus</span>
        <span className={styles.caption}>workbench · v{version}</span>
      </div>
      <div className={styles.spacer} />
      <div className={styles.right}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <LiveDot size={5} />
          connected
        </span>
        <span style={{ color: 'var(--color-ink3)' }}>{storageUsed}</span>
      </div>
    </header>
  )
}
