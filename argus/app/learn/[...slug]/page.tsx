import { Suspense } from 'react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import ClientView from './ClientView'

interface Props {
  params: Promise<{ slug: string[] }>
}

interface SpecIndexNode {
  slug: string
  children: SpecIndexNode[]
}

export default async function LearnSlugPage({ params }: Props) {
  const { slug } = await params
  return (
    <Suspense fallback={null}>
      <ClientView slug={slug.join('/')} />
    </Suspense>
  )
}

function flattenSlugs(nodes: SpecIndexNode[]): string[] {
  const out: string[] = []
  for (const n of nodes) {
    out.push(n.slug)
    if (n.children?.length) out.push(...flattenSlugs(n.children))
  }
  return out
}

export function generateStaticParams() {
  try {
    const path = join(
      process.cwd(),
      'public',
      'spec-source',
      'draft-2026-v1',
      'spec-index.json',
    )
    const raw = readFileSync(path, 'utf-8')
    const idx = JSON.parse(raw) as { tree: SpecIndexNode[] }
    const slugs = flattenSlugs(idx.tree)
    return slugs.map((s) => ({ slug: s.split('/') }))
  } catch {
    return [{ slug: ['index'] }]
  }
}
