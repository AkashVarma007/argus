'use client'

import { useMemo } from 'react'
import { CheckCard } from './CheckCard'
import { getCheck } from '@/lib/conformance/registry'
import { usePrefsStore } from '@/lib/store/prefs'
import type { CheckResult } from '@/lib/store/types'
import styles from './ResultsByCategory.module.css'

const ORDER = [
  'transport', 'jsonrpc', 'lifecycle', 'capabilities',
  'tools', 'resources', 'prompts',
  'sampling', 'elicitation', 'utilities',
  'authorization', 'security', 'tasks', 'hygiene',
  'rc', 'discovery', 'stateless', 'subscriptions', 'caching', 'mrtr',
]

interface Props {
  results: CheckResult[]
  defaultExpand?: (category: string, results: CheckResult[]) => boolean
}

export function ResultsByCategory({ results, defaultExpand }: Props) {
  const expanded = usePrefsStore((s) => s.expandedCategories)
  const setExpanded = usePrefsStore((s) => s.setCategoryExpanded)

  const groups = useMemo(() => {
    const m = new Map<string, CheckResult[]>()
    for (const r of results) {
      const list = m.get(r.category) ?? []
      list.push(r)
      m.set(r.category, list)
    }
    return ORDER.filter((c) => m.has(c)).map((c) => ({ category: c, items: m.get(c)! }))
  }, [results])

  function isOpen(category: string, items: CheckResult[]): boolean {
    if (category in expanded) return expanded[category]
    return defaultExpand ? defaultExpand(category, items) : false
  }

  return (
    <div className={styles.root} data-argus="results-by-category">
      {groups.map(({ category, items }) => {
        const open = isOpen(category, items)
        const fails = items.filter((r) => r.status === 'fail').length
        const passes = items.filter((r) => r.status === 'pass').length
        return (
          <section key={category} className={styles.group} data-category={category}>
            <button
              type="button"
              className={styles.header}
              aria-expanded={open}
              aria-controls={`group-${category}`}
              onClick={() => setExpanded(category, !open)}
              data-argus="category-header"
            >
              <span className={styles.caret} aria-hidden>{open ? '▾' : '▸'}</span>
              <span className={styles.name}>{category}</span>
              <span className={styles.counts}>
                <span className={styles.pass}>{passes}</span>
                <span className={styles.fail}>{fails}</span>
                <span className={styles.total}>/ {items.length}</span>
              </span>
            </button>
            {open && (
              <div
                id={`group-${category}`}
                role="region"
                aria-labelledby={`group-${category}-h`}
                className={styles.body}
              >
                {items.map((r) => {
                  const meta = getCheck(r.checkId)
                  return (
                    <CheckCard
                      key={r.checkId}
                      result={r}
                      title={meta?.title ?? r.checkId}
                      specQuote={meta?.specRef.quote ?? ''}
                    />
                  )
                })}
              </div>
            )}
          </section>
        )
      })}
    </div>
  )
}
