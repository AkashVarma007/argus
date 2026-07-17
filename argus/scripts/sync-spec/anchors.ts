import { slugify } from '../../lib/build/slug'
import type { SpecAnchor } from '../../lib/learn/types'

export function extractAnchors(markdown: string): SpecAnchor[] {
  const anchors: SpecAnchor[] = []
  const seen = new Map<string, number>()
  const lines = markdown.split(/\r?\n/)
  let inFence = false

  for (const line of lines) {
    if (line.startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = line.match(/^(#{1,3})\s+(.+?)\s*$/)
    if (!m) continue
    const level = m[1].length as 1 | 2 | 3
    const text = m[2]
    const base = slugify(text)
    const count = seen.get(base) ?? 0
    seen.set(base, count + 1)
    const id = count === 0 ? base : `${base}-${count + 1}`
    anchors.push({ id, text, level })
  }
  return anchors
}
