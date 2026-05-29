import { describe, it, expect } from 'vitest'
import { runCodegen } from '@/lib/codegen/runner'
import { createBuild, addNode } from '@/lib/build/factory'
import type { Build, ToolDef } from '@/lib/store/types'

function withTool(b: Build): Build {
  return addNode(b, 'tool', {
    name: 'echo',
    description: 'echoes input',
    inputSchema: {
      type: 'object',
      properties: { message: { type: 'string' } },
      required: ['message'],
    },
  } as ToolDef)
}

describe('runCodegen', () => {
  it('refuses when build has error-severity issues', () => {
    const empty: Build = { ...createBuild('demo'), nodes: [], edges: [] }
    const result = runCodegen(empty)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((i) => i.severity === 'error')).toBe(true)
    }
  })

  it('emits a typescript project when language is typescript', () => {
    const build = withTool(createBuild('demo-server'))
    const result = runCodegen(build)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.project.language).toBe('typescript')
      expect(result.project.name).toBe('demo-server')
      expect(result.project.files.length).toBeGreaterThan(0)
      expect(result.project.files.some((f) => f.path === 'package.json')).toBe(true)
    }
  })

  it('emits a python project when language is python', () => {
    const build: Build = { ...withTool(createBuild('demo-server')), language: 'python' }
    const result = runCodegen(build)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.project.language).toBe('python')
      expect(result.project.name).toBe('demo-server')
      expect(result.project.files.some((f) => f.path === 'pyproject.toml')).toBe(true)
    }
  })

  it('slugifies package name for the project name', () => {
    const build = withTool(createBuild('My Cool Server!'))
    const result = runCodegen(build)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.project.name).toBe('my-cool-server')
    }
  })

  it('still generates when only warnings are present', () => {
    const build = withTool(createBuild('demo-server'))
    build.packageMeta.version = 'not-semver'
    const result = runCodegen(build)
    expect(result.ok).toBe(true)
  })
})
