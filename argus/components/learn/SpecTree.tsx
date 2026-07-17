'use client'
import { useMemo, useState } from 'react'
import type { SpecNode } from '@/lib/learn/types'
import styles from './SpecTree.module.css'

interface SpecTreeProps {
  tree: SpecNode[]
  activeSlug: string | null
  onSelect: (slug: string) => void
}

function collectAncestors(tree: SpecNode[], targetSlug: string | null): Set<string> {
  const ancestors = new Set<string>()
  if (!targetSlug) return ancestors
  function walk(node: SpecNode, trail: string[]): boolean {
    const nextTrail = [...trail, node.slug]
    if (node.slug === targetSlug) {
      trail.forEach((s) => ancestors.add(s))
      return true
    }
    for (const child of node.children) {
      if (walk(child, nextTrail)) return true
    }
    return false
  }
  for (const root of tree) walk(root, [])
  return ancestors
}

interface RowProps {
  node: SpecNode
  depth: number
  activeSlug: string | null
  expanded: Set<string>
  onToggle: (slug: string) => void
  onSelect: (slug: string) => void
}

function Row({ node, depth, activeSlug, expanded, onToggle, onSelect }: RowProps) {
  const hasChildren = node.children.length > 0
  const isOpen = expanded.has(node.slug)
  const isActive = node.slug === activeSlug
  const indent = depth * 12

  return (
    <li className={styles.li}>
      <div
        className={isActive ? `${styles.row} ${styles.active}` : styles.row}
        style={{ paddingLeft: 8 + indent }}
        data-active={isActive ? 'true' : undefined}
      >
        {hasChildren ? (
          <button
            type="button"
            className={styles.tri}
            aria-label={isOpen ? 'collapse' : 'expand'}
            data-open={isOpen ? 'true' : 'false'}
            onClick={() => onToggle(node.slug)}
          >
            {isOpen ? '▾' : '▸'}
          </button>
        ) : (
          <span className={styles.triSpacer} aria-hidden="true" />
        )}
        <button
          type="button"
          className={styles.label}
          data-slug={node.slug}
          onClick={() => onSelect(node.slug)}
        >
          {node.title}
        </button>
      </div>
      {hasChildren && isOpen && (
        <ul className={styles.ul}>
          {node.children.map((child) => (
            <Row
              key={child.slug}
              node={child}
              depth={depth + 1}
              activeSlug={activeSlug}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  )
}

export function SpecTree({ tree, activeSlug, onSelect }: SpecTreeProps) {
  const ancestors = useMemo(() => collectAncestors(tree, activeSlug), [tree, activeSlug])
  const [extra, setExtra] = useState<Set<string>>(() => new Set())
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set())

  const expanded = useMemo(() => {
    const merged = new Set<string>(ancestors)
    extra.forEach((s) => merged.add(s))
    collapsed.forEach((s) => merged.delete(s))
    return merged
  }, [ancestors, extra, collapsed])

  function toggle(slug: string) {
    if (expanded.has(slug)) {
      setExtra((prev) => {
        const next = new Set(prev)
        next.delete(slug)
        return next
      })
      setCollapsed((prev) => {
        const next = new Set(prev)
        next.add(slug)
        return next
      })
    } else {
      setCollapsed((prev) => {
        const next = new Set(prev)
        next.delete(slug)
        return next
      })
      setExtra((prev) => {
        const next = new Set(prev)
        next.add(slug)
        return next
      })
    }
  }

  return (
    <nav data-argus="spec-tree" className={styles.root} aria-label="Spec sections">
      <div className={styles.head}>SPEC</div>
      <ul className={styles.ul}>
        {tree.map((node) => (
          <Row
            key={node.slug}
            node={node}
            depth={0}
            activeSlug={activeSlug}
            expanded={expanded}
            onToggle={toggle}
            onSelect={onSelect}
          />
        ))}
      </ul>
    </nav>
  )
}
