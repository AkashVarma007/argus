'use client'
import { useEffect, useMemo, useRef } from 'react'
import type { Build, BuildNode } from '@/lib/store/types'
import { useViewport, type Viewport } from '@/lib/hooks/useViewport'
import { useNodeDrag } from '@/lib/hooks/useNodeDrag'
import { useEdgeDrag, type AnchorRef } from '@/lib/hooks/useEdgeDrag'
import { NodeShape } from './NodeShape'
import { EdgePath, edgePathD } from './EdgePath'
import styles from './Canvas.module.css'

export const NODE_W = 200
export const NODE_H = 64

function anchorWorld(node: BuildNode, side: 'in' | 'out') {
  return {
    x: side === 'in' ? node.position.x : node.position.x + NODE_W,
    y: node.position.y + NODE_H / 2,
  }
}

function findAnchorAt(cx: number, cy: number): AnchorRef | null {
  const els = document.elementsFromPoint(cx, cy)
  for (const el of els) {
    if (!(el instanceof HTMLElement)) continue
    if (el.dataset.argus !== 'anchor') continue
    const side = el.dataset.side
    if (side !== 'in' && side !== 'out') continue
    const nodeEl = el.closest('[data-argus="node"]') as HTMLElement | null
    const nodeId = nodeEl?.dataset.nodeId
    if (!nodeId) continue
    return { nodeId, anchor: side }
  }
  return null
}

interface CanvasProps {
  build: Build
  onUpdateNodePosition: (id: string, position: { x: number; y: number }) => void
  onCreateEdge: (source: AnchorRef, target: AnchorRef) => void
  onSelectNode: (id: string | null) => void
  onSelectEdge: (id: string | null) => void
  selectedNodeId?: string | null
  selectedEdgeId?: string | null
  onViewportChange?: (vp: Viewport) => void
}

export function Canvas({
  build,
  onUpdateNodePosition,
  onCreateEdge,
  onSelectNode,
  onSelectEdge,
  selectedNodeId,
  selectedEdgeId,
  onViewportChange,
}: CanvasProps) {
  const surfaceRef = useRef<HTMLDivElement | null>(null)

  const { viewport, screenToWorld, bindPan, bindZoom } = useViewport({
    initial: build.viewport,
    onChange: onViewportChange,
  })

  useEffect(() => {
    bindPan(surfaceRef.current)
    bindZoom(surfaceRef.current)
  }, [bindPan, bindZoom])

  const nodeById = useMemo(() => {
    const map = new Map<string, BuildNode>()
    for (const n of build.nodes) map.set(n.id, n)
    return map
  }, [build.nodes])

  const { onPointerDown: onNodeDragDown } = useNodeDrag({
    onDrag: onUpdateNodePosition,
    getViewport: () => ({ zoom: viewport.zoom }),
  })

  const { draft, onAnchorDown: onEdgeDragDown } = useEdgeDrag({
    onCreate: onCreateEdge,
    getDropTarget: findAnchorAt,
    screenToWorld: (cx, cy) => {
      const rect = surfaceRef.current?.getBoundingClientRect()
      const ox = rect?.left ?? 0
      const oy = rect?.top ?? 0
      return screenToWorld(cx - ox, cy - oy)
    },
  })

  return (
    <div
      ref={surfaceRef}
      data-argus="canvas"
      className={styles.surface}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onSelectNode(null)
          onSelectEdge(null)
        }
      }}
    >
      <div
        className={styles.world}
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
        }}
      >
        <svg className={styles.edges} aria-hidden="true">
          {build.edges.map((edge) => {
            const s = nodeById.get(edge.source)
            const t = nodeById.get(edge.target)
            if (!s || !t) return null
            return (
              <EdgePath
                key={edge.id}
                source={anchorWorld(s, 'out')}
                target={anchorWorld(t, 'in')}
                kind={edge.kind}
                selected={selectedEdgeId === edge.id}
                onClick={(ev) => {
                  ev.stopPropagation()
                  onSelectEdge(edge.id)
                }}
              />
            )
          })}
          {draft && (
            <path
              data-argus="draft-edge"
              className={styles.draft}
              d={edgePathD(draft.source.point, draft.cursor)}
            />
          )}
        </svg>

        {build.nodes.map((node) => (
          <NodeShape
            key={node.id}
            node={node}
            selected={selectedNodeId === node.id}
            onMouseDown={(e) => {
              onSelectNode(node.id)
              onNodeDragDown(
                e.nativeEvent as unknown as PointerEvent,
                node.id,
                node.position,
              )
            }}
            onAnchorDown={(side, e) => {
              const start = anchorWorld(node, side)
              onEdgeDragDown(
                e.nativeEvent as unknown as PointerEvent,
                { nodeId: node.id, anchor: side },
                start,
              )
            }}
          />
        ))}
      </div>
    </div>
  )
}
