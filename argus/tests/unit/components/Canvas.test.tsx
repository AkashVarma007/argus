import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Canvas } from '@/components/build/Canvas'
import { createBuild, addNode, addEdge } from '@/lib/build/factory'

function noop() {}

describe('Canvas', () => {
  it('renders a node for each build entry', () => {
    let b = createBuild()
    b = addNode(b, 'tool', {
      name: 'echo',
      description: 'echoes input',
      inputSchema: { type: 'object' },
    })
    const { container } = render(
      <Canvas
        build={b}
        onUpdateNodePosition={noop}
        onCreateEdge={noop}
        onSelectNode={noop}
        onSelectEdge={noop}
      />,
    )
    const nodes = container.querySelectorAll('[data-argus="node"]')
    expect(nodes.length).toBe(2)
  })

  it('renders an SVG path for each edge', () => {
    let b = createBuild()
    b = addNode(b, 'tool', {
      name: 'echo',
      description: 'echoes',
      inputSchema: { type: 'object' },
    })
    const serverId = b.nodes[0].id
    const toolId = b.nodes[1].id
    b = addEdge(b, { source: serverId, target: toolId, kind: 'membership' })
    const { container } = render(
      <Canvas
        build={b}
        onUpdateNodePosition={noop}
        onCreateEdge={noop}
        onSelectNode={noop}
        onSelectEdge={noop}
      />,
    )
    const edges = container.querySelectorAll('[data-argus="edge"]')
    expect(edges.length).toBe(1)
  })

  it('deselects when clicking the empty surface', () => {
    const b = createBuild()
    const onSelectNode = vi.fn()
    const onSelectEdge = vi.fn()
    const { container } = render(
      <Canvas
        build={b}
        onUpdateNodePosition={noop}
        onCreateEdge={noop}
        onSelectNode={onSelectNode}
        onSelectEdge={onSelectEdge}
        selectedNodeId={b.nodes[0].id}
      />,
    )
    const surface = container.querySelector('[data-argus="canvas"]') as HTMLElement
    fireEvent.click(surface)
    expect(onSelectNode).toHaveBeenCalledWith(null)
    expect(onSelectEdge).toHaveBeenCalledWith(null)
  })

  it('selects a node when mousedown on the node body', () => {
    const b = createBuild()
    const onSelectNode = vi.fn()
    const { container } = render(
      <Canvas
        build={b}
        onUpdateNodePosition={noop}
        onCreateEdge={noop}
        onSelectNode={onSelectNode}
        onSelectEdge={noop}
      />,
    )
    const node = container.querySelector('[data-argus="node"]') as HTMLElement
    fireEvent.mouseDown(node)
    expect(onSelectNode).toHaveBeenCalledWith(b.nodes[0].id)
  })

  it('applies viewport transform to the world layer', () => {
    const b = createBuild()
    const { container } = render(
      <Canvas
        build={b}
        onUpdateNodePosition={noop}
        onCreateEdge={noop}
        onSelectNode={noop}
        onSelectEdge={noop}
      />,
    )
    const world = container.querySelector('[data-argus="canvas"] > div') as HTMLElement
    expect(world.style.transform).toContain('translate')
    expect(world.style.transform).toContain('scale(1)')
  })
})
