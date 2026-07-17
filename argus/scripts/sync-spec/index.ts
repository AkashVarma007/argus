import type { SpecIndex, SpecIndexEntry, SpecNode } from '../../lib/learn/types'

export interface BuildIndexInput {
  entries: SpecIndexEntry[]
  tree: SpecNode[]
  now?: () => Date
}

export function buildSpecIndex(input: BuildIndexInput): SpecIndex {
  const now = input.now ? input.now() : new Date()
  return {
    tree: input.tree,
    entries: input.entries,
    version: 'draft-2026-v1',
    generatedAt: now.toISOString(),
  }
}
