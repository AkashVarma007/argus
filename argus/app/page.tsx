import { Panel } from '@/components/primitives/Panel'

export default function HomePage() {
  return (
    <section style={{ padding: 32, display: 'grid', gap: 18 }}>
      <Panel title="recent scans">
        <p style={{ color: 'var(--color-ink2)', fontFamily: 'var(--font-mono)', fontSize: 12, margin: 0 }}>
          No scans yet. Argus is watching.
        </p>
      </Panel>
      <Panel title="recent builds">
        <p style={{ color: 'var(--color-ink2)', fontFamily: 'var(--font-mono)', fontSize: 12, margin: 0 }}>
          No builds yet.
        </p>
      </Panel>
    </section>
  )
}
