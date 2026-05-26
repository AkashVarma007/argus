import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'ghost'
}

export function Button({ children, variant = 'primary', className, ...rest }: ButtonProps) {
  return (
    <button
      data-variant={variant}
      className={[styles.root, className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </button>
  )
}
