import type { BuildNode } from '@/lib/store/types'
import styles from './Palette.module.css'

const ITEMS: { type: BuildNode['type']; label: string; blurb: string }[] = [
  { type: 'server',     label: 'Server',     blurb: 'name, version, license' },
  { type: 'tool',       label: 'Tool',       blurb: 'callable with input schema' },
  { type: 'prompt',     label: 'Prompt',     blurb: 'template with arguments' },
  { type: 'resource',   label: 'Resource',   blurb: 'static URI + mimeType' },
  { type: 'capability', label: 'Capability', blurb: 'tools / prompts / resources' },
]

interface PaletteProps {
  onAdd: (type: BuildNode['type']) => void
  disabledTypes?: BuildNode['type'][]
}

export function Palette({ onAdd, disabledTypes }: PaletteProps) {
  const disabled = new Set(disabledTypes ?? [])
  return (
    <div data-argus="palette" className={styles.root}>
      <div className={styles.head}>Palette</div>
      <div className={styles.list}>
        {ITEMS.map((item) => (
          <button
            key={item.type}
            type="button"
            className={styles.item}
            data-node-type={item.type}
            disabled={disabled.has(item.type)}
            onClick={() => onAdd(item.type)}
          >
            <span className={styles.swatch} aria-hidden="true" />
            <span className={styles.label}>{item.label}</span>
            <span className={styles.blurb}>{item.blurb}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
