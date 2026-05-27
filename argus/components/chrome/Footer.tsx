import styles from './Footer.module.css'

interface FooterProps {
  scope: string
}

export function Footer({ scope }: FooterProps) {
  return (
    <footer className={styles.root}>
      <span className={styles.scope}>{scope}</span>
      <span className={styles.spacer} />
      <span className={styles.hint}>⌘K search</span>
    </footer>
  )
}
