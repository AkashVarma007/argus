import type { PromptDef } from '@/lib/store/types'
import { TextField, TextAreaField, Field } from './Field'
import styles from './PromptDefInspector.module.css'

interface PromptDefInspectorProps {
  value: PromptDef
  onChange: (next: PromptDef) => void
}

export function PromptDefInspector({ value, onChange }: PromptDefInspectorProps) {
  const set = (patch: Partial<PromptDef>) => onChange({ ...value, ...patch })

  function updateArg(idx: number, patch: Partial<PromptDef['arguments'][number]>) {
    const next = value.arguments.map((a, i) => (i === idx ? { ...a, ...patch } : a))
    set({ arguments: next })
  }
  function addArg() {
    set({ arguments: [...value.arguments, { name: 'arg', required: false }] })
  }
  function removeArg(idx: number) {
    set({ arguments: value.arguments.filter((_, i) => i !== idx) })
  }

  return (
    <>
      <TextField
        label="Name"
        value={value.name}
        placeholder="my-prompt"
        onChange={(v) => set({ name: v })}
      />
      <TextAreaField
        label="Description"
        value={value.description}
        rows={3}
        placeholder="When the model should use this prompt."
        onChange={(v) => set({ description: v })}
      />
      <Field label="Arguments">
        <div className={styles.list}>
          {value.arguments.length === 0 && (
            <div className={styles.empty}>No arguments.</div>
          )}
          {value.arguments.map((arg, i) => (
            <div key={i} className={styles.row}>
              <input
                className={styles.name}
                value={arg.name}
                placeholder="arg-name"
                onChange={(e) => updateArg(i, { name: e.target.value })}
              />
              <input
                className={styles.desc}
                value={arg.description ?? ''}
                placeholder="description"
                onChange={(e) => updateArg(i, { description: e.target.value })}
              />
              <label className={styles.req}>
                <input
                  type="checkbox"
                  checked={!!arg.required}
                  onChange={(e) => updateArg(i, { required: e.target.checked })}
                />
                required
              </label>
              <button
                type="button"
                className={styles.remove}
                onClick={() => removeArg(i)}
                aria-label="remove argument"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button type="button" className={styles.add} onClick={addArg}>
          + Add argument
        </button>
      </Field>
    </>
  )
}
