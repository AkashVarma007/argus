'use client'
import type { Build, BuildId } from '@/lib/store/types'
import styles from './BuildList.module.css'

interface BuildListProps {
  builds: Build[]
  onOpen(id: BuildId): void
  onCreate(): void
  onDelete(id: BuildId): void
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.valueOf())) return '—'
  return d.toISOString().replace('T', ' ').slice(0, 16)
}

export function BuildList({ builds, onOpen, onCreate, onDelete }: BuildListProps) {
  return (
    <section className={styles.root} data-argus="build-list">
      <header className={styles.head}>
        <span className={styles.title}>Builds</span>
        <button type="button" className={styles.newButton} onClick={onCreate}>
          + New build
        </button>
      </header>
      {builds.length === 0 ? (
        <div className={styles.empty}>No builds yet. Start one to see it here.</div>
      ) : (
        <div className={styles.list} role="table">
          <div className={`${styles.row} ${styles.headRow}`} role="row">
            <span role="columnheader">ID</span>
            <span role="columnheader">Name</span>
            <span role="columnheader">Lang</span>
            <span role="columnheader">Nodes</span>
            <span role="columnheader">Modified</span>
            <span role="columnheader" aria-label="actions" />
          </div>
          {builds.map((b) => (
            <div key={b.id} className={styles.row} role="row" data-build-id={b.id}>
              <span>{b.id}</span>
              <button
                type="button"
                className={styles.open}
                onClick={() => onOpen(b.id)}
              >
                {b.name || b.packageMeta.name || '(unnamed)'}
              </button>
              <span>{b.language}</span>
              <span>{b.nodes.length}</span>
              <span>{formatTime(b.modifiedAt)}</span>
              <button
                type="button"
                className={styles.delete}
                onClick={() => onDelete(b.id)}
                aria-label={`Delete ${b.id}`}
              >
                delete
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
