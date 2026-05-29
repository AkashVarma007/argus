import type { Build, PromptDef } from '@/lib/store/types'
import { slugify } from '@/lib/build/slug'
import type { FileEntry } from '../types'

function argsShape(prompt: PromptDef): string {
  const parts = prompt.arguments.map((a) => {
    let expr = 'z.string()'
    if (a.description) expr += `.describe(${JSON.stringify(a.description)})`
    if (!a.required) expr += '.optional()'
    return `${JSON.stringify(a.name)}: ${expr}`
  })
  return parts.join(', ')
}

function destructure(prompt: PromptDef): string {
  if (prompt.arguments.length === 0) return ''
  return `{ ${prompt.arguments.map((a) => a.name).join(', ')} }`
}

export function generatePromptFile(prompt: PromptDef): FileEntry {
  const name = slugify(prompt.name)
  const description = prompt.description || `${name} prompt`
  const argsExpr = `{ ${argsShape(prompt)} }`
  const handlerArg = destructure(prompt) || '_args'
  const lines = [
    `import { z } from 'zod'`,
    `import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'`,
    ``,
    `// ${description}`,
    `export function register(server: McpServer) {`,
    `  server.prompt(`,
    `    ${JSON.stringify(name)},`,
    `    ${argsExpr},`,
    `    async (${handlerArg}) => ({`,
    `      messages: [`,
    `        {`,
    `          role: 'user',`,
    `          content: { type: 'text', text: \`TODO: render ${name} prompt\` },`,
    `        },`,
    `      ],`,
    `    }),`,
    `  )`,
    `}`,
  ]
  return { path: `src/prompts/${name}.ts`, content: lines.join('\n') + '\n' }
}

export function generatePromptFiles(build: Build): FileEntry[] {
  return build.nodes
    .filter((n) => n.type === 'prompt')
    .map((n) => generatePromptFile(n.data as PromptDef))
}
