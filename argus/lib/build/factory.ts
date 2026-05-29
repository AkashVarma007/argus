import type {
  Build,
  BuildEdge,
  BuildId,
  BuildNode,
  NodeData,
  ServerMeta,
} from '@/lib/store/types'

export const DEFAULT_SERVER_META: ServerMeta = {
  name: 'new-server',
  version: '0.1.0',
  description: '',
  license: 'MIT',
}

export function defaultNodeData(type: BuildNode['type']): NodeData {
  switch (type) {
    case 'server':
      return { ...DEFAULT_SERVER_META }
    case 'tool':
      return {
        name: 'new-tool',
        description: '',
        inputSchema: { type: 'object', properties: {} },
      }
    case 'prompt':
      return { name: 'new-prompt', description: '', arguments: [] }
    case 'resource':
      return {
        uri: 'file:///new-resource',
        mimeType: 'text/plain',
        description: '',
      }
    case 'capability':
      return { exposes: [] }
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

function shortId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID().slice(0, 8)
  }
  return Math.random().toString(36).slice(2, 10)
}

export function createBuild(name?: string): Build {
  const meta: ServerMeta = { ...DEFAULT_SERVER_META }
  if (name) meta.name = name
  return {
    id: `BLD-${shortId()}` as BuildId,
    name: name ?? meta.name,
    language: 'typescript',
    packageMeta: meta,
    nodes: [
      {
        id: 'n-1',
        type: 'server',
        position: { x: 0, y: 0 },
        data: meta,
      },
    ],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
    modifiedAt: nowIso(),
  }
}

export function nextNodeId(b: Build): string {
  let max = 0
  for (const n of b.nodes) {
    const m = /^n-(\d+)$/.exec(n.id)
    if (m) {
      const v = Number.parseInt(m[1], 10)
      if (v > max) max = v
    }
  }
  return `n-${max + 1}`
}

export function nextEdgeId(b: Build): string {
  let max = 0
  for (const e of b.edges) {
    const m = /^e-(\d+)$/.exec(e.id)
    if (m) {
      const v = Number.parseInt(m[1], 10)
      if (v > max) max = v
    }
  }
  return `e-${max + 1}`
}

export function addNode(
  b: Build,
  type: BuildNode['type'],
  data: NodeData,
  position: { x: number; y: number } = { x: 0, y: 0 },
): Build {
  const node: BuildNode = {
    id: nextNodeId(b),
    type,
    position,
    data,
  }
  return { ...b, nodes: [...b.nodes, node] }
}

export function removeNode(b: Build, nodeId: string): Build {
  const nodes = b.nodes.filter((n) => n.id !== nodeId)
  const edges = b.edges.filter((e) => e.source !== nodeId && e.target !== nodeId)
  return { ...b, nodes, edges }
}

export function updateNode(
  b: Build,
  nodeId: string,
  patch: Partial<BuildNode>,
): Build {
  const nodes = b.nodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n))
  return { ...b, nodes }
}

export function addEdge(b: Build, edge: Omit<BuildEdge, 'id'>): Build {
  const full: BuildEdge = { id: nextEdgeId(b), ...edge }
  return { ...b, edges: [...b.edges, full] }
}

export function removeEdge(b: Build, edgeId: string): Build {
  return { ...b, edges: b.edges.filter((e) => e.id !== edgeId) }
}

export function touch(b: Build): Build {
  return { ...b, modifiedAt: nowIso() }
}
