import type { Build, ResourceDef } from '@/lib/store/types'
import type { FileEntry } from '../types'
import { resourceSlug } from './server'

export function generateResourceFile(resource: ResourceDef, index: number): FileEntry {
  const name = resourceSlug(resource.uri, index)
  const description = resource.description || `${name} resource`
  const mime = resource.mimeType || 'text/plain'
  const lines = [
    `import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'`,
    ``,
    `// ${description}`,
    `export function register(server: McpServer) {`,
    `  server.resource(`,
    `    ${JSON.stringify(name)},`,
    `    ${JSON.stringify(resource.uri)},`,
    `    { mimeType: ${JSON.stringify(mime)} },`,
    `    async () => ({`,
    `      contents: [`,
    `        {`,
    `          uri: ${JSON.stringify(resource.uri)},`,
    `          mimeType: ${JSON.stringify(mime)},`,
    `          text: \`TODO: provide ${name} contents\`,`,
    `        },`,
    `      ],`,
    `    }),`,
    `  )`,
    `}`,
  ]
  return { path: `src/resources/${name}.ts`, content: lines.join('\n') + '\n' }
}

export function generateResourceFiles(build: Build): FileEntry[] {
  return build.nodes
    .filter((n) => n.type === 'resource')
    .map((n, i) => generateResourceFile(n.data as ResourceDef, i))
}
