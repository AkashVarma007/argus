import type { MouseEvent } from 'react'
import type {
  BuildNode,
  CapabilityInfo,
  PromptDef,
  ResourceDef,
  ServerMeta,
  ToolDef,
} from '@/lib/store/types'
import styles from './NodeShape.module.css'

export type NodeAnchor = 'in' | 'out'

interface NodeShapeProps {
  node: BuildNode
  selected: boolean
  onMouseDown?: (e: MouseEvent<HTMLDivElement>) => void
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
  onAnchorDown?: (anchor: NodeAnchor, e: MouseEvent<HTMLDivElement>) => void
}

function truncate(s: string, n: number): string {
  if (s.length <= n) return s
  return s.slice(0, n - 1) + '…'
}

function NodeBody({ node }: { node: BuildNode }) {
  switch (node.type) {
    case 'server': {
      const d = node.data as ServerMeta
      return (
        <>
          <div className={styles.title}>{d.name || 'unnamed'}</div>
          <div className={styles.sub}>v{d.version}</div>
        </>
      )
    }
    case 'tool': {
      const d = node.data as ToolDef
      return (
        <>
          <div className={styles.title}>{d.name || 'unnamed'}</div>
          <div className={styles.sub}>{truncate(d.description || 'no description', 64)}</div>
        </>
      )
    }
    case 'prompt': {
      const d = node.data as PromptDef
      const count = d.arguments.length
      return (
        <>
          <div className={styles.title}>{d.name || 'unnamed'}</div>
          <div className={styles.sub}>
            {count} arg{count === 1 ? '' : 's'}
          </div>
        </>
      )
    }
    case 'resource': {
      const d = node.data as ResourceDef
      return (
        <>
          <div className={styles.title}>{truncate(d.uri || 'no uri', 28)}</div>
          <div className={styles.sub}>{d.mimeType || 'unknown'}</div>
        </>
      )
    }
    case 'capability': {
      const d = node.data as CapabilityInfo
      return (
        <>
          <div className={styles.title}>capabilities</div>
          <div className={styles.sub}>{d.exposes.join(', ') || 'none'}</div>
        </>
      )
    }
  }
}

export function NodeShape({
  node,
  selected,
  onMouseDown,
  onClick,
  onAnchorDown,
}: NodeShapeProps) {
  return (
    <div
      data-argus="node"
      data-node-id={node.id}
      data-node-type={node.type}
      data-selected={selected ? 'true' : undefined}
      className={styles.root}
      style={{ transform: `translate(${node.position.x}px, ${node.position.y}px)` }}
      onMouseDown={onMouseDown}
      onClick={onClick}
    >
      <div className={styles.header}>{node.type}</div>
      <div className={styles.body}>
        <NodeBody node={node} />
      </div>
      <div
        className={styles.anchor}
        data-argus="anchor"
        data-side="in"
        role="button"
        aria-label="input anchor"
        onMouseDown={(e) => {
          e.stopPropagation()
          onAnchorDown?.('in', e)
        }}
      />
      <div
        className={styles.anchor}
        data-argus="anchor"
        data-side="out"
        role="button"
        aria-label="output anchor"
        onMouseDown={(e) => {
          e.stopPropagation()
          onAnchorDown?.('out', e)
        }}
      />
    </div>
  )
}
