import { describe, it, expect } from 'vitest'
import { createBuild, addNode, addEdge, removeNode } from '@/lib/build/factory'
import { validateBuild } from '@/lib/build/validate'
import type { ToolDef, PromptDef, ResourceDef } from '@/lib/store/types'

const toolA: ToolDef = {
  name: 'echo',
  description: 'echoes input',
  inputSchema: { type: 'object' },
}
const toolDup: ToolDef = {
  name: 'Echo',
  description: 'duplicate after slugify',
  inputSchema: { type: 'object' },
}
const promptA: PromptDef = { name: 'summarize', description: 'summarize text', arguments: [] }
const resA: ResourceDef = { uri: 'file:///a.txt', mimeType: 'text/plain', description: 'a' }

describe('validateBuild', () => {
  it('default Build has no issues', () => {
    expect(validateBuild(createBuild())).toEqual([])
  })

  it('reports error when server node is missing', () => {
    let b = createBuild()
    b = removeNode(b, b.nodes[0].id)
    const issues = validateBuild(b)
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe('error')
    expect(issues[0].message).toMatch(/no server node/i)
  })

  it('reports error when there are two server nodes', () => {
    let b = createBuild()
    b = addNode(b, 'server', b.packageMeta)
    const issues = validateBuild(b)
    expect(issues.some((i) => /more than one server/i.test(i.message))).toBe(true)
  })

  it('reports error for duplicate tool name (post slugify)', () => {
    let b = createBuild()
    b = addNode(b, 'tool', toolA)
    b = addNode(b, 'tool', toolDup)
    const issues = validateBuild(b)
    expect(issues.some((i) => /duplicate tool name/i.test(i.message))).toBe(true)
  })

  it('reports error for non-object inputSchema', () => {
    let b = createBuild()
    b = addNode(b, 'tool', {
      ...toolA,
      inputSchema: null as unknown as Record<string, unknown>,
    })
    const issues = validateBuild(b)
    expect(issues.some((i) => /invalid inputSchema/i.test(i.message))).toBe(true)
  })

  it('reports warning when tool lacks a description', () => {
    let b = createBuild()
    b = addNode(b, 'tool', { ...toolA, description: '' })
    const issues = validateBuild(b)
    expect(issues.some((i) => i.severity === 'warning' && /no description/i.test(i.message))).toBe(true)
  })

  it('reports error for duplicate resource uri', () => {
    let b = createBuild()
    b = addNode(b, 'resource', resA)
    b = addNode(b, 'resource', { ...resA })
    const issues = validateBuild(b)
    expect(issues.some((i) => /duplicate resource uri/i.test(i.message))).toBe(true)
  })

  it('reports error for edge referencing missing node', () => {
    let b = createBuild()
    b = addEdge(b, { source: b.nodes[0].id, target: 'n-999', kind: 'membership' })
    const issues = validateBuild(b)
    expect(issues.some((i) => /references missing node/i.test(i.message))).toBe(true)
  })

  it('reports warning when prompt-uses-tool targets non-tool', () => {
    let b = createBuild()
    b = addNode(b, 'prompt', promptA)
    b = addNode(b, 'resource', resA)
    const promptId = b.nodes[1].id
    const resourceId = b.nodes[2].id
    b = addEdge(b, { source: promptId, target: resourceId, kind: 'prompt-uses-tool' })
    const issues = validateBuild(b)
    expect(issues.some((i) => i.severity === 'warning' && /prompt-uses-tool but targets a non-tool/i.test(i.message))).toBe(true)
  })

  it('reports warning when packageMeta.version is not semver', () => {
    const b = { ...createBuild(), packageMeta: { ...createBuild().packageMeta, version: 'alpha' } }
    const issues = validateBuild(b)
    expect(issues.some((i) => i.severity === 'warning' && /not valid semver/i.test(i.message))).toBe(true)
  })

  it('attaches a spec:// link to the missing-server-node issue', () => {
    let b = createBuild()
    b = removeNode(b, b.nodes[0].id)
    const issues = validateBuild(b)
    expect(issues[0].specRef).toMatch(/^spec:\/\//)
    expect(issues[0].specRef).toContain('basic/lifecycle')
  })

  it('attaches a spec:// link to duplicate tool issues', () => {
    let b = createBuild()
    b = addNode(b, 'tool', toolA)
    b = addNode(b, 'tool', toolDup)
    const issues = validateBuild(b)
    const dup = issues.find((i) => /duplicate tool name/i.test(i.message))
    expect(dup?.specRef).toMatch(/^spec:\/\/server\/tools/)
  })

  it('attaches a spec:// link to bad inputSchema issues', () => {
    let b = createBuild()
    b = addNode(b, 'tool', {
      ...toolA,
      inputSchema: null as unknown as Record<string, unknown>,
    })
    const issues = validateBuild(b)
    const bad = issues.find((i) => /invalid inputSchema/i.test(i.message))
    expect(bad?.specRef).toMatch(/^spec:\/\/server\/tools/)
  })

  it('attaches a spec:// link to invalid semver warnings', () => {
    const b = { ...createBuild(), packageMeta: { ...createBuild().packageMeta, version: 'alpha' } }
    const issues = validateBuild(b)
    const semver = issues.find((i) => /not valid semver/i.test(i.message))
    expect(semver?.specRef).toMatch(/^spec:\/\//)
  })
})
