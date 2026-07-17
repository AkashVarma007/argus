import { create } from 'zustand'
import { persisted } from './persist'

interface PrefsState {
  lastTab: string
  openTabIds: string[]
  recentEndpoints: string[]
  expandedCategories: Record<string, boolean>
  setLastTab: (id: string) => void
  setOpenTabs: (ids: string[]) => void
  addEndpoint: (endpoint: string) => void
  toggleCategory: (category: string) => void
  setCategoryExpanded: (category: string, open: boolean) => void
}

const MAX_RECENT = 8

export const usePrefsStore = create<PrefsState>()(
  persisted('prefs', (set) => ({
    lastTab: 'home',
    openTabIds: ['home'],
    recentEndpoints: [],
    expandedCategories: {},
    setLastTab: (lastTab) => set({ lastTab }),
    setOpenTabs: (openTabIds) => set({ openTabIds }),
    addEndpoint: (endpoint) =>
      set((s) => {
        const filtered = s.recentEndpoints.filter((e) => e !== endpoint)
        return { recentEndpoints: [endpoint, ...filtered].slice(0, MAX_RECENT) }
      }),
    toggleCategory: (category) =>
      set((s) => ({
        expandedCategories: {
          ...s.expandedCategories,
          [category]: !s.expandedCategories[category],
        },
      })),
    setCategoryExpanded: (category, open) =>
      set((s) => ({
        expandedCategories: {
          ...s.expandedCategories,
          [category]: open,
        },
      })),
  })),
)
