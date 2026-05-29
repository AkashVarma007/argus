import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SERVER_META,
  addEdge,
  addNode,
  createBuild,
  nextEdgeId,
  nextNodeId,
  removeEdge,
  removeNode,
  touch,
  updateNode,
} from '@/lib/build/factory'
import type { ToolDef } from '@/lib/store/types'

const sampleTool: ToolDef = {
  name: 'echo',
  description: 'echoes input',
  inputSchema: { type: 'object', properties: { msg: { type: 'string' } } },
}

describe('createBuild', () => {
  it('returns a Build with exactly one server node', () => {
    const b = createBuild()
    expect(b.nodes).toHaveLength(1)
    expect(b.nodes[0].type).toBe('server')
    expect(b.nodes[0].data).toEqual(DEFAULT_SERVER_META)
  })

  it('uses the provided name in packageMeta and Build.name', () => {
    const b = createBuild('github-readonly')
    expect(b.name).toBe('github-readonly')
    expect(b.packageMeta.name).toBe('github-readonly')
  })

  it('produces BLD-prefixed id', () => {
    const b = createBuild()
    expect(b.id.startsWith('BLD-')).toBe(true)
  })

  it('defaults to typescript language and unit viewport', () => {
    const b = createBuild()
    expect(b.language).toBe('typescript')
    expect(b.viewport).toEqual({ x: 0, y: 0, zoom: 1 })
  })
})

describe('addNode / removeNode / updateNode', () => {
  it('addNode returns a new Build (immutability) and appends a node', () => {
    const b = createBuild()
    const next = addNode(b, 'tool', sampleTool, { x: 80, y: 40 })
    expect(next).not.toBe(b)
    expect(b.nodes).toHaveLength(1)
    expect(next.nodes).toHaveLength(2)
    expect(next.nodes[1]).toMatchObject({
      type: 'tool',
      position: { x: 80, y: 40 },
      data: sampleTool,
    })
  })

  it('removeNode drops the node AND edges that reference it', () => {
    let b = createBuild()
    b = addNode(b, 'tool', sampleTool)
    const toolId = b.nodes[1].id
    b = addEdge(b, { source: b.nodes[0].id, target: toolId, kind: 'membership' })
    const next = removeNode(b, toolId)
    expect(next.nodes.find((n) => n.id === toolId)).toBeUndefined()
    expect(next.edges).toHaveLength(0)
  })

  it('updateNode patches data without mutating original', () => {
    let b = createBuild()
    b = addNode(b, 'tool', sampleTool)
    const next = updateNode(b, b.nodes[1].id, {
      data: { ...sampleTool, description: 'new desc' },
    })
    expect((next.nodes[1].data as ToolDef).description).toBe('new desc')
    expect((b.nodes[1].data as ToolDef).description).toBe('echoes input')
  })
})

describe('addEdge / removeEdge', () => {
  it('addEdge appends edge with monotonic id', () => {
    let b = createBuild()
    b = addNode(b, 'tool', sampleTool)
    const a = addEdge(b, { source: b.nodes[0].id, target: b.nodes[1].id, kind: 'membership' })
    expect(a.edges).toHaveLength(1)
    expect(a.edges[0].id).toBe('e-1')
  })

  it('removeEdge drops the named edge only', () => {
    let b = createBuild()
    b = addNode(b, 'tool', sampleTool)
    b = addEdge(b, { source: b.nodes[0].id, target: b.nodes[1].id, kind: 'membership' })
    const next = removeEdge(b, b.edges[0].id)
    expect(next.edges).toHaveLength(0)
  })
})

describe('nextNodeId / nextEdgeId', () => {
  it('nextNodeId is monotonic over existing nodes', () => {
    const b = createBuild()
    expect(nextNodeId(b)).toBe('n-2')
  })

  it('nextEdgeId starts at e-1 when no edges', () => {
    const b = createBuild()
    expect(nextEdgeId(b)).toBe('e-1')
  })
})

describe('touch', () => {
  it('bumps modifiedAt to a fresh ISO timestamp', async () => {
    const b = createBuild()
    await new Promise((r) => setTimeout(r, 5))
    const next = touch(b)
    expect(Date.parse(next.modifiedAt)).toBeGreaterThanOrEqual(Date.parse(b.modifiedAt))
  })
})
