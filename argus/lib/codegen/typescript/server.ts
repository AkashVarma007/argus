import type { Build, PromptDef, ResourceDef, ToolDef } from '@/lib/store/types'
import { slugify } from '@/lib/build/slug'
import type { FileEntry } from '../types'

function camelize(slug: string): string {
  return slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase())
}

export function resourceSlug(uri: string, index: number): string {
  const m = uri.match(/([a-zA-Z0-9_-]+)(?:\.[a-zA-Z0-9]+)?$/)
  const stem = m ? m[1] : `resource-${index + 1}`
  return slugify(stem) || `resource-${index + 1}`
}

export function generateServerFile(build: Build): FileEntry {
  const tools = build.nodes
    .filter((n) => n.type === 'tool')
    .map((n) => slugify((n.data as ToolDef).name))
  const prompts = build.nodes
    .filter((n) => n.type === 'prompt')
    .map((n) => slugify((n.data as PromptDef).name))
  const resources = build.nodes
    .filter((n) => n.type === 'resource')
    .map((n, i) => resourceSlug((n.data as ResourceDef).uri, i))

  const lines: string[] = []
  lines.push(`import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'`)
  for (const t of tools) {
    lines.push(`import { register as registerTool_${camelize(t)} } from './tools/${t}.js'`)
  }
  for (const p of prompts) {
    lines.push(`import { register as registerPrompt_${camelize(p)} } from './prompts/${p}.js'`)
  }
  for (const r of resources) {
    lines.push(`import { register as registerResource_${camelize(r)} } from './resources/${r}.js'`)
  }
  lines.push('')
  lines.push(`export function createServer(): McpServer {`)
  lines.push(`  const server = new McpServer({`)
  lines.push(`    name: ${JSON.stringify(slugify(build.packageMeta.name) || 'mcp-server')},`)
  lines.push(`    version: ${JSON.stringify(build.packageMeta.version || '0.1.0')},`)
  lines.push(`  })`)
  for (const t of tools) lines.push(`  registerTool_${camelize(t)}(server)`)
  for (const p of prompts) lines.push(`  registerPrompt_${camelize(p)}(server)`)
  for (const r of resources) lines.push(`  registerResource_${camelize(r)}(server)`)
  lines.push(`  return server`)
  lines.push(`}`)

  return { path: 'src/server.ts', content: lines.join('\n') + '\n' }
}
