import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import { runCodegen } from '@/lib/codegen/runner'
import { packZip } from '@/lib/codegen/zip'
import {
  addEdge,
  addNode,
  createBuild,
} from '@/lib/build/factory'
import type {
  Build,
  CapabilityInfo,
  PromptDef,
  ResourceDef,
  ToolDef,
} from '@/lib/store/types'

function blobToBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.readAsArrayBuffer(blob)
  })
}

function richBuild(): Build {
  let b = createBuild('mcp-roundtrip')
  b.packageMeta.description = 'Roundtrip test server'
  b.packageMeta.version = '0.2.1'

  b = addNode(b, 'tool', {
    name: 'echo',
    description: 'returns the input back',
    inputSchema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        loud: { type: 'boolean' },
      },
      required: ['message'],
    },
  } as ToolDef)

  b = addNode(b, 'tool', {
    name: 'sum',
    description: 'adds numbers',
    inputSchema: {
      type: 'object',
      properties: {
        a: { type: 'integer' },
        b: { type: 'integer' },
      },
      required: ['a', 'b'],
    },
  } as ToolDef)

  b = addNode(b, 'prompt', {
    name: 'greet',
    description: 'greets a user',
    arguments: [
      { name: 'who', required: true },
      { name: 'tone', required: false },
    ],
  } as PromptDef)

  b = addNode(b, 'resource', {
    uri: 'file:///fixtures/sample.txt',
    mimeType: 'text/plain',
    description: 'a sample resource',
  } as ResourceDef)

  b = addNode(b, 'capability', {
    exposes: ['tools', 'prompts', 'resources'],
  } as CapabilityInfo)

  const server = b.nodes.find((n) => n.type === 'server')!
  for (const n of b.nodes) {
    if (n.id === server.id) continue
    b = addEdge(b, { source: server.id, target: n.id, kind: 'membership' })
  }
  return b
}

describe('codegen round-trip', () => {
  it('typescript: validates, generates, zips, and unzips with all key files', async () => {
    const build = richBuild()
    const result = runCodegen(build)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const blob = await packZip(result.project)
    const zip = await JSZip.loadAsync(await blobToBuffer(blob))

    const root = 'mcp-roundtrip'
    const pkgFile = zip.file(`${root}/package.json`)
    expect(pkgFile).not.toBeNull()
    const pkg = JSON.parse(await pkgFile!.async('string'))
    expect(pkg.name).toBe('mcp-roundtrip')
    expect(pkg.dependencies['@modelcontextprotocol/sdk']).toBeTruthy()

    const indexFile = await zip.file(`${root}/src/index.ts`)!.async('string')
    expect(indexFile).toContain('StdioServerTransport')

    const serverFile = await zip.file(`${root}/src/server.ts`)!.async('string')
    expect(serverFile).toContain('createServer')
    expect(serverFile).toContain('registerTool_echo')
    expect(serverFile).toContain('registerTool_sum')

    const echoFile = await zip.file(`${root}/src/tools/echo.ts`)!.async('string')
    expect(echoFile).toContain('server.tool(')
    expect(echoFile).toContain('"echo"')

    expect(zip.file(`${root}/src/prompts/greet.ts`)).not.toBeNull()
    expect(zip.file(`${root}/src/resources/sample.ts`)).not.toBeNull()
  })

  it('python: validates, generates, zips, and unzips with all key files', async () => {
    const build: Build = { ...richBuild(), language: 'python' }
    const result = runCodegen(build)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    const blob = await packZip(result.project)
    const zip = await JSZip.loadAsync(await blobToBuffer(blob))

    const root = 'mcp-roundtrip'
    const py = zip.file(`${root}/pyproject.toml`)
    expect(py).not.toBeNull()
    const pyContent = await py!.async('string')
    expect(pyContent).toContain('name = "mcp-roundtrip"')
    expect(pyContent).toContain('mcp>=1.0.0')

    const serverPy = await zip
      .file(`${root}/src/mcp_roundtrip/server.py`)!
      .async('string')
    expect(serverPy).toContain('FastMCP("mcp-roundtrip")')
    expect(serverPy).toContain('register_tool_echo(server)')

    const echoPy = await zip
      .file(`${root}/src/mcp_roundtrip/tools/echo.py`)!
      .async('string')
    expect(echoPy).toContain('@server.tool()')
    expect(echoPy).toContain('def echo(message: str')

    expect(zip.file(`${root}/src/mcp_roundtrip/__main__.py`)).not.toBeNull()
    expect(zip.file(`${root}/src/mcp_roundtrip/prompts/greet.py`)).not.toBeNull()
    expect(zip.file(`${root}/src/mcp_roundtrip/resources/sample.py`)).not.toBeNull()
  })

  it('refuses to generate when build is invalid', () => {
    const broken: Build = { ...createBuild('broken'), nodes: [], edges: [] }
    const result = runCodegen(broken)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.issues.some((i) => /no server/i.test(i.message))).toBe(true)
    }
  })
})
