import type { Build, ToolDef } from '@/lib/store/types'
import { slugify } from '@/lib/build/slug'
import type { FileEntry } from '../types'
import { jsonSchemaToZodShape } from './jsonSchemaToZod'

export function generateToolFile(tool: ToolDef): FileEntry {
  const name = slugify(tool.name)
  const shape = jsonSchemaToZodShape(tool.inputSchema)
  const description = tool.description || `${name} tool`
  const lines = [
    `import { z } from 'zod'`,
    `import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'`,
    ``,
    `const inputShape = { ${shape} }`,
    ``,
    `export function register(server: McpServer) {`,
    `  server.tool(`,
    `    ${JSON.stringify(name)},`,
    `    ${JSON.stringify(description)},`,
    `    inputShape,`,
    `    async (input) => {`,
    `      // TODO: implement ${name}`,
    `      return {`,
    `        content: [`,
    `          { type: 'text', text: \`called ${name} with: \${JSON.stringify(input)}\` },`,
    `        ],`,
    `      }`,
    `    },`,
    `  )`,
    `}`,
  ]
  return { path: `src/tools/${name}.ts`, content: lines.join('\n') + '\n' }
}

export function generateToolFiles(build: Build): FileEntry[] {
  return build.nodes
    .filter((n) => n.type === 'tool')
    .map((n) => generateToolFile(n.data as ToolDef))
}
