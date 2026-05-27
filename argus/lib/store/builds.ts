import { create } from 'zustand'
import { persisted } from './persist'
import type { Build } from './types'

interface BuildsState {
  builds: Record<string, Build>
  upsertBuild: (build: Build) => void
  removeBuild: (id: string) => void
  list: () => Build[]
}

export const useBuildsStore = create<BuildsState>()(
  persisted('builds', (set, get) => ({
    builds: {},
    upsertBuild: (build) =>
      set((s) => ({ builds: { ...s.builds, [build.id]: build } })),
    removeBuild: (id) =>
      set((s) => {
        const next = { ...s.builds }
        delete next[id]
        return { builds: next }
      }),
    list: () =>
      Object.values(get().builds).sort(
        (a, b) => Date.parse(b.modifiedAt) - Date.parse(a.modifiedAt),
      ),
  })),
)
