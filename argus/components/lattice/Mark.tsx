interface MarkProps {
  size?: number
  ink?: string
  dim?: string
}

export function Mark({ size = 22, ink = 'var(--color-ink0)', dim = 'var(--color-hairline)' }: MarkProps) {
  const cells: number[][] = []
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) cells.push([r, c])
  }
  const cell = (size - 2) / 4
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Argus">
      {cells.map(([r, c]) => (
        <rect
          key={`${r}-${c}`}
          x={r * cell + 1}
          y={c * cell + 1}
          width={cell - 1}
          height={cell - 1}
          fill={(r + c) % 2 === 0 ? ink : dim}
        />
      ))}
    </svg>
  )
}
