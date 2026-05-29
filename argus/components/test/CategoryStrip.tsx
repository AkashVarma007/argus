// argus/components/test/CategoryStrip.tsx
'use client'

import styles from './CategoryStrip.module.css'
import type { CheckResult } from '@/lib/store/types'

interface Props {
  results: CheckResult[]
  selected: string | null
  onSelect: (category: string | null) => void
}

const ORDER = [
  'transport', 'jsonrpc', 'lifecycle', 'capabilities',
  'tools', 'resources', 'prompts',
  'sampling', 'elicitation', 'utilities',
  'authorization', 'security', 'tasks', 'hygiene',
  'rc', 'discovery', 'stateless', 'subscriptions', 'caching', 'mrtr',
]

export function CategoryStrip({ results, selected, onSelect }: Props) {
  const byCat = new Map<string, { pass: number; fail: number; skip: number; total: number }>()
  for (const r of results) {
    const e = byCat.get(r.category) ?? { pass: 0, fail: 0, skip: 0, total: 0 }
    e.total++
    if (r.status === 'pass') e.pass++
    else if (r.status === 'fail') e.fail++
    else if (r.status === 'skip') e.skip++
    byCat.set(r.category, e)
  }

  return (
    <ul className={styles.strip} data-argus="category-strip">
      {ORDER.filter((c) => byCat.has(c)).map((c) => {
        const s = byCat.get(c)!
        const pct = s.total === 0 ? 0 : (s.pass / Math.max(1, s.total - s.skip)) * 100
        return (
          <li
            key={c}
            className={styles.row}
            data-selected={selected === c ? 'true' : undefined}
            onClick={() => onSelect(selected === c ? null : c)}
          >
            <span className={styles.name}>{c}</span>
            <span className={styles.counts}>
              <span className={styles.pass}>{s.pass}</span>
              <span className={styles.fail}>{s.fail}</span>
              <span className={styles.skip}>{s.skip}</span>
            </span>
            <span className={styles.bar}>
              <span className={styles.fill} style={{ width: `${pct}%` }} />
            </span>
          </li>
        )
      })}
    </ul>
  )
}
