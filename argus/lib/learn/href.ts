import type { SpecIndex, SpecIndexEntry } from './types'

export interface ParsedSpecHref {
  slug: string
  anchor: string | null
}

export function parseSpecScheme(href: string): ParsedSpecHref | null {
  if (!href.startsWith('spec://')) return null
  const tail = href.slice('spec://'.length)
  if (!tail) return null
  const hashIdx = tail.indexOf('#')
  const slug = hashIdx < 0 ? tail : tail.slice(0, hashIdx)
  const anchor = hashIdx < 0 ? null : tail.slice(hashIdx + 1) || null
  if (!slug) return null
  return { slug, anchor }
}

function findEntry(index: SpecIndex, slug: string): SpecIndexEntry | null {
  return index.entries.find((e) => e.slug === slug) ?? null
}

function findEntryByAnchor(
  index: SpecIndex,
  anchorId: string,
): { entry: SpecIndexEntry; anchorId: string } | null {
  for (const entry of index.entries) {
    for (const a of entry.anchors) {
      if (a.id === anchorId || a.text === anchorId) {
        return { entry, anchorId: a.id }
      }
    }
  }
  return null
}

export function resolveSpecHref(specRef: string, index: SpecIndex): string | null {
  const parsed = parseSpecScheme(specRef)
  if (!parsed) return null

  const direct = findEntry(index, parsed.slug)
  if (direct) {
    return parsed.anchor
      ? `/learn/${parsed.slug}?pulse=${encodeURIComponent(parsed.anchor)}#${parsed.anchor}`
      : `/learn/${parsed.slug}`
  }

  const byAnchor = findEntryByAnchor(index, parsed.slug)
  if (byAnchor) {
    return `/learn/${byAnchor.entry.slug}?pulse=${encodeURIComponent(byAnchor.anchorId)}#${byAnchor.anchorId}`
  }
  return null
}
