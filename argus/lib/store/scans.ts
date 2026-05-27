import { create } from 'zustand'
import { persisted } from './persist'
import type { Scan, ScanId } from './types'

interface ScansState {
  scans: Record<ScanId, Scan>
  addScan: (scan: Scan) => void
  removeScan: (id: ScanId) => void
  list: () => Scan[]
}

export const useScansStore = create<ScansState>()(
  persisted('scans', (set, get) => ({
    scans: {},
    addScan: (scan) =>
      set((s) => ({ scans: { ...s.scans, [scan.id]: scan } })),
    removeScan: (id) =>
      set((s) => {
        const next = { ...s.scans }
        delete next[id]
        return { scans: next }
      }),
    list: () =>
      Object.values(get().scans).sort(
        (a, b) => Date.parse(b.startedAt) - Date.parse(a.startedAt),
      ),
  })),
)
