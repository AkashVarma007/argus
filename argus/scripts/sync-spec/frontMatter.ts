import matter from 'gray-matter'

export interface StripResult {
  title: string
  body: string
}

const MINTLIFY_KEYS = new Set(['mode', 'sidebarTitle', 'icon', 'iconType'])

function firstHeadingTitle(body: string): string | null {
  const lines = body.split(/\r?\n/)
  let inFence = false
  for (const line of lines) {
    if (line.startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    const m = line.match(/^#\s+(.+?)\s*$/)
    if (m) return m[1]
  }
  return null
}

export function stripFrontMatter(raw: string): StripResult {
  const parsed = matter(raw)
  const data = parsed.data as Record<string, unknown>
  for (const key of MINTLIFY_KEYS) delete data[key]

  let title = typeof data.title === 'string' && data.title.trim() ? data.title : null
  if (!title) title = firstHeadingTitle(parsed.content)
  if (!title) title = 'Untitled'

  return { title, body: parsed.content }
}
