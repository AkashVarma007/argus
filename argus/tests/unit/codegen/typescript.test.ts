import { describe, it, expect } from 'vitest'
import { typescriptCodegen } from '@/lib/codegen/typescript'
import { jsonSchemaToZod, jsonSchemaToZodShape } from '@/lib/codegen/typescript/jsonSchemaToZod'
import { createBuild, addNode, defaultNodeData } from '@/lib/build/factory'
import type { ToolDef } from '@/lib/store/types'

describe('jsonSchemaToZod', () => {
  it('maps primitives', () => {
    expect(jsonSchemaToZod({ type: 'string' })).toBe('z.string()')
    expect(jsonSchemaToZod({ type: 'integer' })).toBe('z.number()')
    expect(jsonSchemaToZod({ type: 'boolean' })).toBe('z.boolean()')
  })

  it('emits z.array with item type', () => {
    const z = jsonSchemaToZod({ type: 'array', items: { type: 'string' } })
    expect(z).toBe('z.array(z.string())')
  })

  it('emits z.enum for string enum', () => {
    const z = jsonSchemaToZod({ type: 'string', enum: ['a', 'b'] })
    expect(z).toContain('z.enum')
    expect(z).toContain('"a"')
  })

  it('emits optional for non-required properties', () => {
    const shape = jsonSchemaToZodShape({
      type: 'object',
      properties: { name: { type: 'string' }, age: { type: 'integer' } },
      required: ['name'],
    })
    expect(shape).toContain('"name": z.string()')
    expect(shape).toContain('"age": z.number().optional()')
  })
})

describe('typescriptCodegen', () => {
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
    b = addNode(b, 'prompt', {
      name: 'summarize',
      description: 'summarize text',
      arguments: [{ name: 'text', required: true }],
    })
    b = addNode(b, 'resource', defaultNodeData('resource'))
    return b
  }

  it('emits package.json with derived name and SDK dependency', () => {
    const files = typescriptCodegen.generate(buildSample())
    const pkg = files.find((f) => f.path === 'package.json')!
    const json = JSON.parse(pkg.content)
    expect(json.name).toBe('demo-server')
    expect(json.dependencies['@modelcontextprotocol/sdk']).toBeTruthy()
    expect(json.scripts.build).toBe('tsc')
  })

  it('emits tsconfig.json with strict mode', () => {
    const files = typescriptCodegen.generate(buildSample())
    const ts = files.find((f) => f.path === 'tsconfig.json')!
    const json = JSON.parse(ts.content)
    expect(json.compilerOptions.strict).toBe(true)
    expect(json.compilerOptions.outDir).toBe('dist')
  })

  it('emits src/server.ts that registers every node', () => {
    const files = typescriptCodegen.generate(buildSample())
    const server = files.find((f) => f.path === 'src/server.ts')!
    expect(server.content).toContain('registerTool_echo(server)')
    expect(server.content).toContain('registerPrompt_summarize(server)')
    expect(server.content).toContain('registerResource_')
    expect(server.content).toContain('name: "demo-server"')
  })

  it('emits per-tool files with zod input shape', () => {
    const files = typescriptCodegen.generate(buildSample())
    const tool = files.find((f) => f.path === 'src/tools/echo.ts')!
    expect(tool.content).toContain('server.tool(')
    expect(tool.content).toContain('"message": z.string()')
  })

  it('emits per-prompt files with arg schema and handler', () => {
    const files = typescriptCodegen.generate(buildSample())
    const prompt = files.find((f) => f.path === 'src/prompts/summarize.ts')!
    expect(prompt.content).toContain('server.prompt(')
    expect(prompt.content).toContain('"text": z.string()')
  })

  it('emits a resource file with the configured uri and mime', () => {
    const files = typescriptCodegen.generate(buildSample())
    const resource = files.find((f) => f.path.startsWith('src/resources/'))!
    expect(resource.content).toContain('server.resource(')
    expect(resource.content).toContain('text/plain')
  })

  it('emits src/index.ts using StdioServerTransport', () => {
    const files = typescriptCodegen.generate(buildSample())
    const entry = files.find((f) => f.path === 'src/index.ts')!
    expect(entry.content).toContain('StdioServerTransport')
    expect(entry.content).toContain('createServer()')
  })

  it('emits README listing tools, prompts, resources', () => {
    const files = typescriptCodegen.generate(buildSample())
    const readme = files.find((f) => f.path === 'README.md')!
    expect(readme.content).toContain('## Tools')
    expect(readme.content).toContain('echo')
    expect(readme.content).toContain('summarize')
  })

  it('emits .gitignore that excludes node_modules and dist', () => {
    const files = typescriptCodegen.generate(buildSample())
    const ignore = files.find((f) => f.path === '.gitignore')!
    expect(ignore.content).toContain('node_modules')
    expect(ignore.content).toContain('dist')
  })
})
