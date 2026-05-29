import { describe, it, expect, vi } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { NodeShape } from '@/components/build/NodeShape'
import type { BuildNode } from '@/lib/store/types'

const serverNode: BuildNode = {
  id: 'n-1',
  type: 'server',
  position: { x: 10, y: 20 },
  data: { name: 'demo', version: '0.1.0', description: '', license: 'MIT' },
}

const toolNode: BuildNode = {
  id: 'n-2',
  type: 'tool',
  position: { x: 0, y: 0 },
  data: { name: 'echo', description: 'echoes input', inputSchema: { type: 'object' } },
}

const promptNode: BuildNode = {
  id: 'n-3',
  type: 'prompt',
  position: { x: 0, y: 0 },
  data: { name: 'summarize', description: 'summarize text', arguments: [{ name: 'q' }] },
}

const resourceNode: BuildNode = {
  id: 'n-4',
  type: 'resource',
  position: { x: 0, y: 0 },
  data: { uri: 'file:///a.txt', mimeType: 'text/plain', description: 'a' },
}

const capabilityNode: BuildNode = {
  id: 'n-5',
  type: 'capability',
  position: { x: 0, y: 0 },
  data: { exposes: ['tools', 'prompts'] },
}

describe('NodeShape', () => {
  it('renders server node name and version', () => {
    const { getByText } = render(<NodeShape node={serverNode} selected={false} />)
    expect(getByText('demo')).toBeTruthy()
    expect(getByText('v0.1.0')).toBeTruthy()
  })

  it('renders tool node name and truncated description', () => {
    const { getByText } = render(<NodeShape node={toolNode} selected={false} />)
    expect(getByText('echo')).toBeTruthy()
    expect(getByText('echoes input')).toBeTruthy()
  })

  it('renders prompt node arg count with correct pluralization', () => {
    const { getByText } = render(<NodeShape node={promptNode} selected={false} />)
    expect(getByText('summarize')).toBeTruthy()
    expect(getByText('1 arg')).toBeTruthy()
  })

  it('renders resource node uri and mime', () => {
    const { getByText } = render(<NodeShape node={resourceNode} selected={false} />)
    expect(getByText('file:///a.txt')).toBeTruthy()
    expect(getByText('text/plain')).toBeTruthy()
  })

  it('renders capability node exposes list', () => {
    const { getByText } = render(<NodeShape node={capabilityNode} selected={false} />)
    expect(getByText('capabilities')).toBeTruthy()
    expect(getByText('tools, prompts')).toBeTruthy()
  })

  it('reflects selected state via data attribute', () => {
    const { container } = render(<NodeShape node={serverNode} selected />)
    const root = container.querySelector('[data-argus="node"]')
    expect(root?.getAttribute('data-selected')).toBe('true')
  })

  it('positions the node via transform style', () => {
    const { container } = render(<NodeShape node={serverNode} selected={false} />)
    const root = container.querySelector('[data-argus="node"]') as HTMLElement
    expect(root.style.transform).toBe('translate(10px, 20px)')
  })

  it('invokes onMouseDown when the body is pressed', () => {
    const onMouseDown = vi.fn()
    const { container } = render(
      <NodeShape node={serverNode} selected={false} onMouseDown={onMouseDown} />,
    )
    const root = container.querySelector('[data-argus="node"]') as HTMLElement
    fireEvent.mouseDown(root)
    expect(onMouseDown).toHaveBeenCalledTimes(1)
  })

  it('invokes onClick when the body is clicked', () => {
    const onClick = vi.fn()
    const { container } = render(
      <NodeShape node={serverNode} selected={false} onClick={onClick} />,
    )
    const root = container.querySelector('[data-argus="node"]') as HTMLElement
    fireEvent.click(root)
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('invokes onAnchorDown with the side identifier', () => {
    const onAnchorDown = vi.fn()
    const onMouseDown = vi.fn()
    const { container } = render(
      <NodeShape
        node={serverNode}
        selected={false}
        onAnchorDown={onAnchorDown}
        onMouseDown={onMouseDown}
      />,
    )
    const inAnchor = container.querySelector('[data-side="in"]') as HTMLElement
    const outAnchor = container.querySelector('[data-side="out"]') as HTMLElement
    fireEvent.mouseDown(inAnchor)
    fireEvent.mouseDown(outAnchor)
    expect(onAnchorDown).toHaveBeenNthCalledWith(1, 'in', expect.anything())
    expect(onAnchorDown).toHaveBeenNthCalledWith(2, 'out', expect.anything())
    expect(onMouseDown).not.toHaveBeenCalled()
  })
})
