import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { Inspector } from '@/components/build/Inspector'
import { createBuild, addNode, addEdge, defaultNodeData } from '@/lib/build/factory'

function makeHandlers() {
  return {
    onPackageMetaChange: vi.fn(),
    onNodeChange: vi.fn(),
    onEdgeChange: vi.fn(),
    onLanguageChange: vi.fn(),
    onDeleteNode: vi.fn(),
    onDeleteEdge: vi.fn(),
  }
}

describe('Inspector', () => {
  it('renders package metadata when nothing is selected', () => {
    const b = createBuild()
    const handlers = makeHandlers()
    const { getByText } = render(<Inspector build={b} {...handlers} />)
    expect(getByText('Package')).toBeTruthy()
  })

  it('routes to ToolDefInspector when a tool node is selected', () => {
    let b = createBuild()
    b = addNode(b, 'tool', defaultNodeData('tool'))
    const toolId = b.nodes[1].id
    const handlers = makeHandlers()
    const { container } = render(
      <Inspector build={b} selectedNodeId={toolId} {...handlers} />,
    )
    expect(container.querySelector('[data-argus="schema-editor"]')).toBeTruthy()
  })

  it('emits onPackageMetaChange when the package name changes', () => {
    const b = createBuild()
    const handlers = makeHandlers()
    const { container } = render(<Inspector build={b} {...handlers} />)
    const nameInput = container.querySelector('input') as HTMLInputElement
    fireEvent.change(nameInput, { target: { value: 'changed' } })
    expect(handlers.onPackageMetaChange).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'changed' }),
    )
  })

  it('emits onLanguageChange when the language select changes', () => {
    const b = createBuild()
    const handlers = makeHandlers()
    const { container } = render(<Inspector build={b} {...handlers} />)
    const select = container.querySelector('select') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'python' } })
    expect(handlers.onLanguageChange).toHaveBeenCalledWith('python')
  })

  it('renders the edge editor when an edge is selected', () => {
    let b = createBuild()
    b = addNode(b, 'tool', defaultNodeData('tool'))
    const serverId = b.nodes[0].id
    const toolId = b.nodes[1].id
    b = addEdge(b, { source: serverId, target: toolId, kind: 'membership' })
    const edgeId = b.edges[0].id
    const handlers = makeHandlers()
    const { container, getByText } = render(
      <Inspector build={b} selectedEdgeId={edgeId} {...handlers} />,
    )
    expect(getByText(`edge · ${edgeId}`)).toBeTruthy()
    const select = container.querySelector('select') as HTMLSelectElement
    expect(select.value).toBe('membership')
  })

  it('invokes onDeleteEdge when the delete button is clicked', () => {
    let b = createBuild()
    b = addNode(b, 'tool', defaultNodeData('tool'))
    b = addEdge(b, {
      source: b.nodes[0].id,
      target: b.nodes[1].id,
      kind: 'membership',
    })
    const edgeId = b.edges[0].id
    const handlers = makeHandlers()
    const { getByText } = render(
      <Inspector build={b} selectedEdgeId={edgeId} {...handlers} />,
    )
    fireEvent.click(getByText('Delete edge'))
    expect(handlers.onDeleteEdge).toHaveBeenCalledWith(edgeId)
  })

  it('does not show a delete button for the server node', () => {
    const b = createBuild()
    const serverId = b.nodes[0].id
    const handlers = makeHandlers()
    const { queryByText } = render(
      <Inspector build={b} selectedNodeId={serverId} {...handlers} />,
    )
    expect(queryByText('Delete node')).toBeNull()
  })

  it('emits onDeleteNode for non-server nodes', () => {
    let b = createBuild()
    b = addNode(b, 'tool', defaultNodeData('tool'))
    const toolId = b.nodes[1].id
    const handlers = makeHandlers()
    const { getByText } = render(
      <Inspector build={b} selectedNodeId={toolId} {...handlers} />,
    )
    fireEvent.click(getByText('Delete node'))
    expect(handlers.onDeleteNode).toHaveBeenCalledWith(toolId)
  })
})
