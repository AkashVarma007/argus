import type { SpecNode } from '../../lib/learn/types'

export interface RawDoc {
  slug: string
  title: string
  parentSlug: string | null
}

function isIndexSlug(slug: string): boolean {
  return slug === 'index' || slug.endsWith('/index')
}

function sortChildren(nodes: SpecNode[]): SpecNode[] {
  return nodes.sort((a, b) => {
    const ai = isIndexSlug(a.slug) ? 0 : 1
    const bi = isIndexSlug(b.slug) ? 0 : 1
    if (ai !== bi) return ai - bi
    return a.slug.localeCompare(b.slug)
  })
}

export function buildTree(docs: RawDoc[]): SpecNode[] {
  const bySlug = new Map<string, SpecNode>()
  for (const d of docs) {
    bySlug.set(d.slug, {
      slug: d.slug,
      title: d.title,
      parentSlug: d.parentSlug,
      children: [],
    })
  }

  const roots: SpecNode[] = []
  for (const node of bySlug.values()) {
    const parent = node.parentSlug ? bySlug.get(node.parentSlug) : null
    if (parent) {
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  }

  function recurse(node: SpecNode) {
    node.children = sortChildren(node.children)
    for (const c of node.children) recurse(c)
  }
  for (const root of roots) recurse(root)

  return sortChildren(roots)
}
