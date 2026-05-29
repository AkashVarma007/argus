import { describe, it, expect } from 'vitest'
import { pythonCodegen } from '@/lib/codegen/python'
import {
  jsonSchemaToPyType,
  paramsFromSchema,
} from '@/lib/codegen/python/jsonSchemaToPy'
import { createBuild, addNode, defaultNodeData } from '@/lib/build/factory'
import type { ToolDef } from '@/lib/store/types'

describe('jsonSchemaToPyType', () => {
  it('maps primitives', () => {
    expect(jsonSchemaToPyType({ type: 'string' })).toBe('str')
    expect(jsonSchemaToPyType({ type: 'integer' })).toBe('int')
    expect(jsonSchemaToPyType({ type: 'boolean' })).toBe('bool')
  })

  it('maps arrays to list[T]', () => {
    expect(jsonSchemaToPyType({ type: 'array', items: { type: 'string' } })).toBe(
      'list[str]',
    )
  })

  it('writes required params before optional ones', () => {
    const params = paramsFromSchema({
      type: 'object',
      properties: { x: { type: 'string' }, y: { type: 'integer' } },
      required: ['x'],
    })
    expect(params).toContain('x: str')
    expect(params).toContain('y: int | None = None')
  })
})

describe('pythonCodegen', () => {
  function buildSample() {
    let b = createBuild('demo-server')
    b = addNode(b, 'tool', {
      name: 'echo',
      description: 'echoes input',
      inputSchema: {
        type: 'object',
        properties: { message: { type: 'string' } },
        required: ['message'],
      },
    } as ToolDef)
    b = addNode(b, 'prompt', defaultNodeData('prompt'))
    b = addNode(b, 'resource', defaultNodeData('resource'))
    return b
  }

  it('emits pyproject.toml with mcp dependency and project name', () => {
    const files = pythonCodegen.generate(buildSample())
    const pyproject = files.find((f) => f.path === 'pyproject.toml')!
    expect(pyproject.content).toContain('name = "demo-server"')
    expect(pyproject.content).toContain('mcp>=1.0.0')
    expect(pyproject.content).toContain('demo_server.__main__:main')
  })

  it('emits __init__.py files for the package and subpackages', () => {
    const files = pythonCodegen.generate(buildSample())
    const initPaths = files.filter((f) => f.path.endsWith('__init__.py')).map((f) => f.path)
    expect(initPaths).toContain('src/demo_server/__init__.py')
    expect(initPaths).toContain('src/demo_server/tools/__init__.py')
    expect(initPaths).toContain('src/demo_server/prompts/__init__.py')
    expect(initPaths).toContain('src/demo_server/resources/__init__.py')
  })

  it('emits server.py wiring registrations to FastMCP', () => {
    const files = pythonCodegen.generate(buildSample())
    const server = files.find((f) => f.path === 'src/demo_server/server.py')!
    expect(server.content).toContain('FastMCP("demo-server")')
    expect(server.content).toContain('register_tool_echo(server)')
  })

  it('emits a tool file using @server.tool() decorator', () => {
    const files = pythonCodegen.generate(buildSample())
    const tool = files.find((f) => f.path === 'src/demo_server/tools/echo.py')!
    expect(tool.content).toContain('@server.tool()')
    expect(tool.content).toContain('def echo(message: str)')
  })

  it('emits __main__.py running the server', () => {
    const files = pythonCodegen.generate(buildSample())
    const main = files.find((f) => f.path === 'src/demo_server/__main__.py')!
    expect(main.content).toContain('create_server()')
    expect(main.content).toContain('server.run()')
  })

  it('emits .gitignore that excludes pycache and venv', () => {
    const files = pythonCodegen.generate(buildSample())
    const gi = files.find((f) => f.path === '.gitignore')!
    expect(gi.content).toContain('__pycache__')
    expect(gi.content).toContain('.venv')
  })
})
