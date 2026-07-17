'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Route } from 'next'
import { BuildList } from '@/components/build/BuildList'
import { useBuildsStore } from '@/lib/store/builds'
import { createBuild } from '@/lib/build/factory'
import type { BuildId } from '@/lib/store/types'
import styles from './page.module.css'

export default function BuildIndexPage() {
  const router = useRouter()
  const buildsMap = useBuildsStore((s) => s.builds)
  const upsertBuild = useBuildsStore((s) => s.upsertBuild)
  const removeBuild = useBuildsStore((s) => s.removeBuild)

  const builds = useMemo(
    () =>
      Object.values(buildsMap).sort(
        (a, b) => Date.parse(b.modifiedAt) - Date.parse(a.modifiedAt),
      ),
    [buildsMap],
  )

  function handleCreate() {
    const fresh = createBuild('new-server')
    upsertBuild(fresh)
    router.push(`/build/canvas?id=${encodeURIComponent(fresh.id)}` as Route)
  }

  function handleOpen(id: BuildId) {
    router.push(`/build/canvas?id=${encodeURIComponent(id)}` as Route)
  }

  function handleDelete(id: BuildId) {
    removeBuild(id)
  }

  return (
    <section className={styles.root}>
      <BuildList
        builds={builds}
        onCreate={handleCreate}
        onOpen={handleOpen}
        onDelete={handleDelete}
      />
    </section>
  )
}
