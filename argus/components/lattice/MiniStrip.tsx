type CellState = 'pass' | 'fail' | 'skip' | 'pending'

interface MiniStripProps {
  states?: CellState[]
}

const COLOR: Record<CellState, string> = {
  pass: 'var(--color-signal)',
  fail: 'var(--color-warn)',
  skip: 'var(--color-ink4)',
  pending: 'var(--color-hairline)',
}

export function MiniStrip({ states = Array(19).fill('pending') as CellState[] }: MiniStripProps) {
  return (
    <div
      data-argus="mini-strip"
      style={{ display: 'inline-flex', gap: 1, height: 10, alignItems: 'stretch' }}
    >
      {states.map((s, i) => (
        <span
          key={i}
          data-argus="mini-cell"
          data-state={s}
          style={{
            width: 3,
            background: COLOR[s],
            display: 'inline-block',
          }}
        />
      ))}
    </div>
  )
}
