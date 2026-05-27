import { create } from 'zustand'
import { persisted } from './persist'

interface PrefsState {
  lastTab: string
  openTabIds: string[]
  recentEndpoints: string[]
  setLastTab: (id: string) => void
  setOpenTabs: (ids: string[]) => void
  addEndpoint: (endpoint: string) => void
}

const MAX_RECENT = 8

export const usePrefsStore = create<PrefsState>()(
  persisted('prefs', (set) => ({
    lastTab: 'home',
    openTabIds: ['home'],
    recentEndpoints: [],
    setLastTab: (lastTab) => set({ lastTab }),
    setOpenTabs: (openTabIds) => set({ openTabIds }),
    addEndpoint: (endpoint) =>
      set((s) => {
        const filtered = s.recentEndpoints.filter((e) => e !== endpoint)
        return { recentEndpoints: [endpoint, ...filtered].slice(0, MAX_RECENT) }
      }),
  })),
)
