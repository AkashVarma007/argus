import type { Build, ToolDef } from '@/lib/store/types'
import { slugify } from '@/lib/build/slug'
import type { FileEntry } from '../types'
import { pythonModuleName } from './util'
import { paramsFromSchema } from './jsonSchemaToPy'

function pyName(slug: string): string {
  return slug.replace(/-/g, '_')
}

export function generateToolPy(tool: ToolDef, moduleName: string): FileEntry {
  const slug = slugify(tool.name)
  const name = pyName(slug)
  const params = paramsFromSchema(tool.inputSchema)
  const sig = params ? `${name}(${params})` : `${name}()`
  const doc = tool.description || `${name} tool`
  const lines = [
    'from typing import Any',
    'from mcp.server.fastmcp import FastMCP',
    '',
    '',
    'def register(server: FastMCP) -> None:',
    '    @server.tool()',
    `    def ${sig} -> str:`,
    `        """${doc}"""`,
    `        # TODO: implement ${name}`,
    `        return f"called ${name}"`,
  ]
  return {
    path: `src/${moduleName}/tools/${name}.py`,
    content: lines.join('\n') + '\n',
  }
}

export function generateToolFiles(build: Build): FileEntry[] {
  const moduleName = pythonModuleName(build.packageMeta.name)
  return build.nodes
    .filter((n) => n.type === 'tool')
    .map((n) => generateToolPy(n.data as ToolDef, moduleName))
}
