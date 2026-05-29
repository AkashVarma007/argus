import type { Build, PromptDef, ResourceDef, ToolDef } from '@/lib/store/types'
import { slugify } from '@/lib/build/slug'
import type { FileEntry } from '../types'
import { pythonModuleName, resourceModuleName } from './util'

function pyName(slug: string): string {
  return slug.replace(/-/g, '_')
}

export function generateServerPy(build: Build): FileEntry {
  const moduleName = pythonModuleName(build.packageMeta.name)
  const serverName = slugify(build.packageMeta.name || 'mcp-server')

  const tools = build.nodes
    .filter((n) => n.type === 'tool')
    .map((n) => pyName(slugify((n.data as ToolDef).name)))
  const prompts = build.nodes
    .filter((n) => n.type === 'prompt')
    .map((n) => pyName(slugify((n.data as PromptDef).name)))
  const resources = build.nodes
    .filter((n) => n.type === 'resource')
    .map((n, i) => resourceModuleName((n.data as ResourceDef).uri, i))

  const lines: string[] = []
  lines.push('from mcp.server.fastmcp import FastMCP')
  lines.push('')
  for (const t of tools) {
    lines.push(`from .tools.${t} import register as register_tool_${t}`)
  }
  for (const p of prompts) {
    lines.push(`from .prompts.${p} import register as register_prompt_${p}`)
  }
  for (const r of resources) {
    lines.push(`from .resources.${r} import register as register_resource_${r}`)
  }
  lines.push('')
  lines.push('')
  lines.push('def create_server() -> FastMCP:')
  lines.push(`    server = FastMCP("${serverName}")`)
  for (const t of tools) lines.push(`    register_tool_${t}(server)`)
  for (const p of prompts) lines.push(`    register_prompt_${p}(server)`)
  for (const r of resources) lines.push(`    register_resource_${r}(server)`)
  lines.push('    return server')
  return { path: `src/${moduleName}/server.py`, content: lines.join('\n') + '\n' }
}

export function generateInitFiles(build: Build): FileEntry[] {
  const moduleName = pythonModuleName(build.packageMeta.name)
  const dirs = ['', 'tools', 'prompts', 'resources']
  return dirs.map((d) => ({
    path: d
      ? `src/${moduleName}/${d}/__init__.py`
      : `src/${moduleName}/__init__.py`,
    content: '',
  }))
}
