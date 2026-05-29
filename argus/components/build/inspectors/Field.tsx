import type { ChangeEvent, ReactNode } from 'react'
import styles from './Field.module.css'

interface FieldProps {
  label: string
  hint?: string
  children: ReactNode
}

export function Field({ label, hint, children }: FieldProps) {
  return (
    <div className={styles.field}>
      <div className={styles.label}>{label}</div>
      {children}
      {hint && <div className={styles.hint}>{hint}</div>}
    </div>
  )
}

interface TextFieldProps {
  label: string
  value: string
  hint?: string
  placeholder?: string
  onChange: (v: string) => void
}

export function TextField({ label, value, hint, placeholder, onChange }: TextFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <input
        className={styles.input}
        value={value}
        placeholder={placeholder}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
      />
    </Field>
  )
}

interface TextAreaFieldProps extends TextFieldProps {
  rows?: number
}

export function TextAreaField({
  label,
  value,
  hint,
  placeholder,
  rows = 3,
  onChange,
}: TextAreaFieldProps) {
  return (
    <Field label={label} hint={hint}>
      <textarea
        className={styles.textarea}
        value={value}
        placeholder={placeholder}
        rows={rows}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
      />
    </Field>
  )
}
