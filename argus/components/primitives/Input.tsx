import type { InputHTMLAttributes, ReactNode } from 'react'
import styles from './Input.module.css'

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  prefix?: ReactNode
}

export function Input({ prefix, className, ...rest }: InputProps) {
  return (
    <label className={[styles.wrap, className].filter(Boolean).join(' ')}>
      {prefix && <span className={styles.prefix}>{prefix}</span>}
      <input className={styles.input} {...rest} />
    </label>
  )
}
