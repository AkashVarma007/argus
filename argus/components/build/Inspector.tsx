'use client'
import type {
  Build,
  BuildEdge,
  BuildNode,
  CapabilityInfo,
  NodeData,
  PromptDef,
  ResourceDef,
  ServerMeta,
  ToolDef,
} from '@/lib/store/types'
import { ServerMetaInspector } from './inspectors/ServerMetaInspector'
import { ToolDefInspector } from './inspectors/ToolDefInspector'
import { PromptDefInspector } from './inspectors/PromptDefInspector'
import { ResourceDefInspector } from './inspectors/ResourceDefInspector'
import { CapabilityInfoInspector } from './inspectors/CapabilityInfoInspector'
import styles from './Inspector.module.css'

interface InspectorProps {
  build: Build
  selectedNodeId?: string | null
  selectedEdgeId?: string | null
  onPackageMetaChange: (meta: ServerMeta) => void
  onNodeChange: (id: string, data: NodeData) => void
  onEdgeChange: (id: string, patch: Partial<BuildEdge>) => void
  onLanguageChange: (lang: Build['language']) => void
  onDeleteNode: (id: string) => void
  onDeleteEdge: (id: string) => void
}

function PerNodeInspector({
  node,
  onChange,
}: {
  node: BuildNode
  onChange: (data: NodeData) => void
}) {
  switch (node.type) {
    case 'server':
      return (
        <ServerMetaInspector
          value={node.data as ServerMeta}
          onChange={(v) => onChange(v)}
        />
      )
    case 'tool':
      return (
        <ToolDefInspector
          value={node.data as ToolDef}
          onChange={(v) => onChange(v)}
        />
      )
    case 'prompt':
      return (
        <PromptDefInspector
          value={node.data as PromptDef}
          onChange={(v) => onChange(v)}
        />
      )
    case 'resource':
      return (
        <ResourceDefInspector
          value={node.data as ResourceDef}
          onChange={(v) => onChange(v)}
        />
      )
    case 'capability':
      return (
        <CapabilityInfoInspector
          value={node.data as CapabilityInfo}
          onChange={(v) => onChange(v)}
        />
      )
  }
}

export function Inspector({
  build,
  selectedNodeId,
  selectedEdgeId,
  onPackageMetaChange,
  onNodeChange,
  onEdgeChange,
  onLanguageChange,
  onDeleteNode,
  onDeleteEdge,
}: InspectorProps) {
  const selectedNode = selectedNodeId
    ? build.nodes.find((n) => n.id === selectedNodeId) ?? null
    : null
  const selectedEdge = selectedEdgeId
    ? build.edges.find((e) => e.id === selectedEdgeId) ?? null
    : null

  let title = 'Package'
  let body: React.ReactNode = (
    <>
      <ServerMetaInspector value={build.packageMeta} onChange={onPackageMetaChange} />
      <div className={styles.section}>
        <div className={styles.label}>Codegen language</div>
        <select
          className={styles.select}
          value={build.language}
          onChange={(e) => onLanguageChange(e.target.value as Build['language'])}
        >
          <option value="typescript">TypeScript</option>
          <option value="python">Python</option>
        </select>
      </div>
    </>
  )

  if (selectedNode) {
    title = `${selectedNode.type} · ${selectedNode.id}`
    body = (
      <>
        <PerNodeInspector
          node={selectedNode}
          onChange={(data) => onNodeChange(selectedNode.id, data)}
        />
        {selectedNode.type !== 'server' && (
          <button
            type="button"
            className={styles.danger}
            onClick={() => onDeleteNode(selectedNode.id)}
          >
            Delete node
          </button>
        )}
      </>
    )
  } else if (selectedEdge) {
    title = `edge · ${selectedEdge.id}`
    body = (
      <>
        <div className={styles.section}>
          <div className={styles.label}>Kind</div>
          <select
            className={styles.select}
            value={selectedEdge.kind}
            onChange={(e) =>
              onEdgeChange(selectedEdge.id, { kind: e.target.value as BuildEdge['kind'] })
            }
          >
            <option value="membership">membership</option>
            <option value="dependency">dependency</option>
            <option value="prompt-uses-tool">prompt-uses-tool</option>
          </select>
        </div>
        <button
          type="button"
          className={styles.danger}
          onClick={() => onDeleteEdge(selectedEdge.id)}
        >
          Delete edge
        </button>
      </>
    )
  }

  return (
    <div data-argus="inspector" className={styles.root}>
      <div className={styles.head}>{title}</div>
      <div className={styles.body}>{body}</div>
    </div>
  )
}
