#!/usr/bin/env tsx
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { stripFrontMatter } from './sync-spec/frontMatter'
import { extractAnchors } from './sync-spec/anchors'
import { buildTree, type RawDoc } from './sync-spec/tree'
import { buildSpecIndex } from './sync-spec/index'
import type { SpecIndexEntry } from '../lib/learn/types'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))

const SOURCE_DIR = path.resolve(
  SCRIPT_DIR,
  '..',
  'spec-source',
  'draft',
)
const OUT_DIR = path.resolve(
  SCRIPT_DIR,
  '..',
  'public',
  'spec-source',
  'draft-2026-v1',
)

async function exists(p: string): Promise<boolean> {
  try {
    await fs.stat(p)
    return true
  } catch {
    return false
  }
}

async function walk(dir: string): Promise<string[]> {
  const out: string[] = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const e of entries) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) {
      out.push(...(await walk(full)))
    } else if (e.isFile() && (e.name.endsWith('.mdx') || e.name.endsWith('.md'))) {
      out.push(full)
    }
  }
  return out
}

function pathToSlug(rel: string): string {
  let s = rel.replace(/\\/g, '/').replace(/\.(mdx|md)$/i, '')
  if (s.endsWith('/index')) s = s.slice(0, -'/index'.length)
  if (s === '') s = 'index'
  return s
}

function parentOf(slug: string): string | null {
  if (slug === 'index') return null
  const i = slug.lastIndexOf('/')
  return i < 0 ? null : slug.slice(0, i)
}

function excerptOf(body: string, max = 160): string {
  let inFence = false
  const out: string[] = []
  for (const line of body.split(/\r?\n/)) {
    if (line.startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue
    if (line.startsWith('#')) continue
    if (line.trim() === '') continue
    out.push(line.trim())
    if (out.join(' ').length >= max) break
  }
  const joined = out.join(' ').replace(/\s+/g, ' ').trim()
  return joined.length > max ? joined.slice(0, max - 1).trimEnd() + '…' : joined
}

async function main() {
  if (!(await exists(SOURCE_DIR))) {
    console.warn(`[sync-spec] source not found: ${SOURCE_DIR} — skipping.`)
    await fs.mkdir(OUT_DIR, { recursive: true })
    const empty = buildSpecIndex({ entries: [], tree: [] })
    await fs.writeFile(
      path.join(OUT_DIR, 'spec-index.json'),
      JSON.stringify(empty, null, 2),
      'utf8',
    )
    return
  }

  await fs.mkdir(OUT_DIR, { recursive: true })

  const files = await walk(SOURCE_DIR)
  const entries: SpecIndexEntry[] = []
  const rawDocs: RawDoc[] = []

  for (const file of files) {
    const rel = path.relative(SOURCE_DIR, file)
    const slug = pathToSlug(rel)
    const raw = await fs.readFile(file, 'utf8')
    const { title, body } = stripFrontMatter(raw)
    const anchors = extractAnchors(body)
    const excerpt = excerptOf(body)
    const parentSlug = parentOf(slug)

    const outPath = path.join(OUT_DIR, `${slug}.md`)
    await fs.mkdir(path.dirname(outPath), { recursive: true })
    await fs.writeFile(outPath, body, 'utf8')

    entries.push({ slug, title, excerpt, anchors, parentSlug })
    rawDocs.push({ slug, title, parentSlug })
  }

  const tree = buildTree(rawDocs)
  const index = buildSpecIndex({ entries, tree })
  await fs.writeFile(
    path.join(OUT_DIR, 'spec-index.json'),
    JSON.stringify(index, null, 2),
    'utf8',
  )
  console.log(`[sync-spec] wrote ${entries.length} pages → ${OUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
