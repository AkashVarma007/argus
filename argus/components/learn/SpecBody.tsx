'use client'
import { useEffect, useMemo, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypePrismPlus from 'rehype-prism-plus'
import type { SpecAnchor } from '@/lib/learn/types'
import styles from './SpecBody.module.css'

interface SpecBodyProps {
  markdown: string
  onAnchorMount?: (anchors: SpecAnchor[]) => void
}

function readAnchorsFromDom(root: HTMLElement): SpecAnchor[] {
  const out: SpecAnchor[] = []
  const headings = root.querySelectorAll('h1[id], h2[id], h3[id]')
  headings.forEach((el) => {
    const tag = el.tagName.toLowerCase()
    const level = tag === 'h1' ? 1 : tag === 'h2' ? 2 : 3
    const id = el.getAttribute('id') ?? ''
    if (!id) return
    out.push({ id, text: el.textContent ?? '', level })
  })
  return out
}

export function SpecBody({ markdown, onAnchorMount }: SpecBodyProps) {
  const ref = useRef<HTMLDivElement | null>(null)
  const remarkPlugins = useMemo(() => [remarkGfm], [])
  const rehypePlugins = useMemo<React.ComponentProps<typeof ReactMarkdown>['rehypePlugins']>(
    () => [rehypeSlug, [rehypePrismPlus, { ignoreMissing: true }]],
    [],
  )

  useEffect(() => {
    if (!ref.current || !onAnchorMount) return
    onAnchorMount(readAnchorsFromDom(ref.current))
  }, [markdown, onAnchorMount])

  return (
    <article data-argus="spec-body" className={styles.root}>
      <div ref={ref} className={styles.prose}>
        <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={rehypePlugins}>
          {markdown}
        </ReactMarkdown>
      </div>
    </article>
  )
}
