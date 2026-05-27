import { persist as zPersist, createJSONStorage } from 'zustand/middleware'
import type { StateCreator } from 'zustand'

export function persisted<T>(
  name: string,
  initializer: StateCreator<T, [], [], T>,
) {
  return zPersist<T>(initializer, {
    name: `argus.${name}`,
    storage: createJSONStorage(() => localStorage),
    version: 1,
  })
}
