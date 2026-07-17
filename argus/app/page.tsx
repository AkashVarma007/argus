'use client'

import Link from 'next/link'
import type { Route } from 'next'
import { useMemo } from 'react'
import { Panel } from '@/components/primitives/Panel'
import { EmptyState } from '@/components/primitives/EmptyState'
import { useScansStore } from '@/lib/store/scans'
import { useBuildsStore } from '@/lib/store/builds'

export default function HomePage() {
  const scansMap = useScansStore((s) => s.scans)
  const buildsMap = useBuildsStore((s) => s.builds)

  const scans = useMemo(
    () =>
      Object.values(scansMap).sort(
        (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
      ),
    [scansMap],
  )
  const builds = useMemo(
    () =>
      Object.values(buildsMap).sort(
        (a, b) => Date.parse(b.modifiedAt) - Date.parse(a.modifiedAt),
      ),
    [buildsMap],
  )

  return (
    <section style={{ padding: 32, display: 'grid', gap: 18 }}>
      <Panel title="recent scans">
        {scans.length === 0 ? (
          <EmptyState
            heading="No scans yet"
            description="Run a conformance scan against any MCP server to grade it across 60+ checks."
            ctaLabel="Start a scan"
            ctaHref="/test"
          />
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {scans.slice(0, 5).map((s) => (
              <li key={s.id}>
                <Link href={`/test/scan?id=${encodeURIComponent(s.id)}` as Route} style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  {s.id} — {s.endpoint} — {s.grade}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel title="recent builds">
        {builds.length === 0 ? (
          <EmptyState
            heading="No builds yet"
            description="Compose an MCP server from a typed lattice of tools, resources, and prompts."
            ctaLabel="Start a build"
            ctaHref="/build"
          />
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
            {builds.slice(0, 5).map((b) => (
              <li key={b.id}>
                <Link href={`/build/canvas?id=${encodeURIComponent(b.id)}` as Route} style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                  {b.id} — {b.name || b.packageMeta.name || '(unnamed)'} — {b.language}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </section>
  )
}
