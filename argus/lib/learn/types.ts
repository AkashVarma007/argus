export interface SpecAnchor {
  id: string
  text: string
  level: 1 | 2 | 3
}

export interface SpecNode {
  slug: string
  title: string
  parentSlug: string | null
  children: SpecNode[]
}

export interface SpecIndexEntry {
  slug: string
  title: string
  excerpt: string
  anchors: SpecAnchor[]
  parentSlug: string | null
}

export interface SpecIndex {
  tree: SpecNode[]
  entries: SpecIndexEntry[]
  version: 'draft-2026-v1'
  generatedAt: string
}
