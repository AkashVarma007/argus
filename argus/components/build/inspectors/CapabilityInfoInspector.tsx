import type { CapabilityInfo } from '@/lib/store/types'
import { Field } from './Field'
import styles from './CapabilityInfoInspector.module.css'

const KNOWN_EXPOSES = ['tools', 'prompts', 'resources', 'logging', 'roots'] as const

interface CapabilityInfoInspectorProps {
  value: CapabilityInfo
  onChange: (next: CapabilityInfo) => void
}

export function CapabilityInfoInspector({ value, onChange }: CapabilityInfoInspectorProps) {
  function toggle(key: string, on: boolean) {
    const set = new Set(value.exposes)
    if (on) set.add(key)
    else set.delete(key)
    onChange({ exposes: Array.from(set) })
  }
  return (
    <Field label="Exposes" hint="Which MCP capabilities this server advertises.">
      <div className={styles.grid}>
        {KNOWN_EXPOSES.map((key) => (
          <label key={key} className={styles.row}>
            <input
              type="checkbox"
              checked={value.exposes.includes(key)}
              onChange={(e) => toggle(key, e.target.checked)}
            />
            <span>{key}</span>
          </label>
        ))}
      </div>
    </Field>
  )
}
