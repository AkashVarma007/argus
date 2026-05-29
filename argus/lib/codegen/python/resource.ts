import type { Build, ResourceDef } from '@/lib/store/types'
import type { FileEntry } from '../types'
import { pythonModuleName, resourceModuleName } from './util'

export function generateResourcePy(
  resource: ResourceDef,
  index: number,
  moduleName: string,
): FileEntry {
  const name = resourceModuleName(resource.uri, index)
  const doc = resource.description || `${name} resource`
  const mime = resource.mimeType || 'text/plain'
  const uri = JSON.stringify(resource.uri)
  const lines = [
    'from mcp.server.fastmcp import FastMCP',
    '',
    '',
    'def register(server: FastMCP) -> None:',
    `    @server.resource(${uri}, mime_type=${JSON.stringify(mime)})`,
    `    def ${name}() -> str:`,
    `        """${doc}"""`,
    `        # TODO: provide ${name} contents`,
    `        return "TODO"`,
  ]
  return {
    path: `src/${moduleName}/resources/${name}.py`,
    content: lines.join('\n') + '\n',
  }
}

export function generateResourceFiles(build: Build): FileEntry[] {
  const moduleName = pythonModuleName(build.packageMeta.name)
  return build.nodes
    .filter((n) => n.type === 'resource')
    .map((n, i) => generateResourcePy(n.data as ResourceDef, i, moduleName))
}
