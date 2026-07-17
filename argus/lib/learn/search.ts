import Fuse from 'fuse.js'
import type { SpecAnchor, SpecIndex, SpecIndexEntry } from './types'

export interface SpecSearchHit {
  slug: string
  title: string
  excerpt: string
  score: number
  matchedAnchor: SpecAnchor | null
}

interface FuseDoc {
  slug: string
  title: string
  excerpt: string
  anchorTexts: string[]
  anchors: SpecAnchor[]
}

function toDoc(entry: SpecIndexEntry): FuseDoc {
  return {
    slug: entry.slug,
    title: entry.title,
    excerpt: entry.excerpt,
    anchorTexts: entry.anchors.map((a) => a.text),
    anchors: entry.anchors,
  }
}

let cachedFuse: { index: SpecIndex; fuse: Fuse<FuseDoc> } | null = null

function getFuse(index: SpecIndex): Fuse<FuseDoc> {
  if (cachedFuse && cachedFuse.index === index) return cachedFuse.fuse
  const docs = index.entries.map(toDoc)
  const fuse = new Fuse(docs, {
    includeScore: true,
    threshold: 0.4,
    ignoreLocation: true,
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'excerpt', weight: 0.3 },
      { name: 'anchorTexts', weight: 0.1 },
    ],
  })
  cachedFuse = { index, fuse }
  return fuse
}

export function searchSpec(
  index: SpecIndex,
  query: string,
  max = 20,
): SpecSearchHit[] {
  const q = query.trim()
  if (!q) return []
  const fuse = getFuse(index)
  const results = fuse.search(q, { limit: max })
  return results.map((r) => {
    const matchedAnchor =
      r.item.anchors.find((a) => a.text.toLowerCase().includes(q.toLowerCase())) ?? null
    return {
      slug: r.item.slug,
      title: r.item.title,
      excerpt: r.item.excerpt,
      score: r.score ?? 1,
      matchedAnchor,
    }
  })
}

export function _resetSearchCache(): void {
  cachedFuse = null
}
