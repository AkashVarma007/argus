import styles from './TabStrip.module.css'

export interface Tab {
  id: string
  label: string
}

interface TabStripProps {
  tabs: Tab[]
  activeId: string
  onClose?: (id: string) => void
  onSelect?: (id: string) => void
}

export function TabStrip({ tabs, activeId, onClose, onSelect }: TabStripProps) {
  return (
    <nav className={styles.root}>
      {tabs.map((t) => (
        <div
          key={t.id}
          data-argus="tab"
          data-active={t.id === activeId ? 'true' : undefined}
          className={styles.tab}
          onClick={() => onSelect?.(t.id)}
        >
          {t.label}
          {onClose && (
            <span
              className={styles.close}
              onClick={(e) => {
                e.stopPropagation()
                onClose(t.id)
              }}
            >
              ×
            </span>
          )}
        </div>
      ))}
      <div className={styles.spacer} />
    </nav>
  )
}
