'use client'

import { useMemo, useState } from 'react'
import { useBuildsStore } from '@/lib/store/builds'
import { Palette } from '@/components/build/Palette'
import { Canvas } from '@/components/build/Canvas'
import { Inspector } from '@/components/build/Inspector'
import { ValidationStrip } from '@/components/build/ValidationStrip'
import { GenerateModal } from '@/components/build/GenerateModal'
import {
  addEdge,
  addNode,
  defaultNodeData,
  removeEdge,
  removeNode,
  touch,
  updateNode,
} from '@/lib/build/factory'
import { validateBuild } from '@/lib/build/validate'
import type {
  Build,
  BuildEdge,
  BuildIssue,
  NodeData,
  ServerMeta,
} from '@/lib/store/types'
import type { AnchorRef } from '@/lib/hooks/useEdgeDrag'
import type { Viewport } from '@/lib/hooks/useViewport'
import styles from './page.module.css'

interface ClientViewProps {
  buildId: string
}

export default function ClientView({ buildId }: ClientViewProps) {
  const build = useBuildsStore((s) => s.builds[buildId])
  const upsertBuild = useBuildsStore((s) => s.upsertBuild)

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const issues = useMemo<BuildIssue[]>(
    () => (build ? validateBuild(build) : []),
    [build],
  )

  if (!build) {
    return (
      <section className={styles.missing}>build · {buildId} · not found</section>
    )
  }

  function save(next: Build) {
    upsertBuild(touch(next))
  }

  function handleAddNode(type: Build['nodes'][number]['type']) {
    const next = addNode(build!, type, defaultNodeData(type), {
      x: 40 + (build!.nodes.length % 6) * 220,
      y: 80 + Math.floor(build!.nodes.length / 6) * 120,
    })
    save(next)
  }

  function handleNodePosition(id: string, position: { x: number; y: number }) {
    save(updateNode(build!, id, { position }))
  }

  function handleCreateEdge(source: AnchorRef, target: AnchorRef) {
    if (source.nodeId === target.nodeId) return
    save(
      addEdge(build!, {
        source: source.nodeId,
        target: target.nodeId,
        kind: 'dependency',
      }),
    )
  }

  function handleNodeData(id: string, data: NodeData) {
    save(updateNode(build!, id, { data }))
  }

  function handlePackageMeta(meta: ServerMeta) {
    const next: Build = { ...build!, packageMeta: meta, name: meta.name }
    const serverNode = next.nodes.find((n) => n.type === 'server')
    if (serverNode) {
      next.nodes = next.nodes.map((n) =>
        n.id === serverNode.id ? { ...n, data: meta } : n,
      )
    }
    save(next)
  }

  function handleEdgePatch(id: string, patch: Partial<BuildEdge>) {
    save({
      ...build!,
      edges: build!.edges.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    })
  }

  function handleLanguage(language: Build['language']) {
    save({ ...build!, language })
  }

  function handleDeleteNode(id: string) {
    save(removeNode(build!, id))
    if (selectedNodeId === id) setSelectedNodeId(null)
  }

  function handleDeleteEdge(id: string) {
    save(removeEdge(build!, id))
    if (selectedEdgeId === id) setSelectedEdgeId(null)
  }

  function handleViewport(vp: Viewport) {
    save({ ...build!, viewport: vp })
  }

  function focusIssue(issue: BuildIssue) {
    if (issue.nodeId) {
      setSelectedNodeId(issue.nodeId)
      setSelectedEdgeId(null)
    } else if (issue.edgeId) {
      setSelectedEdgeId(issue.edgeId)
      setSelectedNodeId(null)
    }
  }

  const hasServer = build.nodes.some((n) => n.type === 'server')

  return (
    <section className={styles.root}>
      <header className={styles.head}>
        <div className={styles.title}>
          <span className={styles.name}>{build.name}</span>
          <span className={styles.id}>{build.id}</span>
        </div>
        <button
          type="button"
          className={styles.generate}
          onClick={() => setModalOpen(true)}
        >
          Generate
        </button>
      </header>
      <main className={styles.main}>
        <Palette
          onAdd={handleAddNode}
          disabledTypes={hasServer ? ['server'] : []}
        />
        <div className={styles.canvas}>
          <Canvas
            build={build}
            selectedNodeId={selectedNodeId}
            selectedEdgeId={selectedEdgeId}
            onUpdateNodePosition={handleNodePosition}
            onCreateEdge={handleCreateEdge}
            onSelectNode={(id) => {
              setSelectedNodeId(id)
              if (id) setSelectedEdgeId(null)
            }}
            onSelectEdge={(id) => {
              setSelectedEdgeId(id)
              if (id) setSelectedNodeId(null)
            }}
            onViewportChange={handleViewport}
          />
        </div>
        <Inspector
          build={build}
          selectedNodeId={selectedNodeId}
          selectedEdgeId={selectedEdgeId}
          onPackageMetaChange={handlePackageMeta}
          onNodeChange={handleNodeData}
          onEdgeChange={handleEdgePatch}
          onLanguageChange={handleLanguage}
          onDeleteNode={handleDeleteNode}
          onDeleteEdge={handleDeleteEdge}
        />
      </main>
      <ValidationStrip issues={issues} onFocus={focusIssue} />
      <GenerateModal
        build={build}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onLanguageChange={handleLanguage}
      />
    </section>
  )
}
