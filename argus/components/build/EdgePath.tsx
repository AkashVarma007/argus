import type { MouseEvent } from 'react'
import type { BuildEdge } from '@/lib/store/types'
import styles from './EdgePath.module.css'

interface Point {
  x: number
  y: number
}

interface EdgePathProps {
  source: Point
  target: Point
  kind: BuildEdge['kind']
  selected?: boolean
  onClick?: (e: MouseEvent<SVGPathElement>) => void
}

const MIN_PULL = 40

export function edgePathD(source: Point, target: Point): string {
  const dx = target.x - source.x
  const pull = Math.max(MIN_PULL, Math.abs(dx) / 2)
  const c1x = source.x + pull
  const c2x = target.x - pull
  return `M ${source.x} ${source.y} C ${c1x} ${source.y}, ${c2x} ${target.y}, ${target.x} ${target.y}`
}

export function EdgePath({ source, target, kind, selected, onClick }: EdgePathProps) {
  return (
    <path
      data-argus="edge"
      data-kind={kind}
      data-selected={selected ? 'true' : undefined}
      className={styles.path}
      d={edgePathD(source, target)}
      onClick={onClick}
    />
  )
}
