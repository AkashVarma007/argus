import type { Build, PromptDef } from '@/lib/store/types'
import { slugify } from '@/lib/build/slug'
import type { FileEntry } from '../types'
import { pythonIdentifier, pythonModuleName } from './util'

function pyName(slug: string): string {
  return slug.replace(/-/g, '_')
}

function paramsFromArgs(args: PromptDef['arguments']): string {
  return args
    .map((a) => {
      const name = pythonIdentifier(a.name)
      return a.required ? `${name}: str` : `${name}: str | None = None`
    })
    .join(', ')
}

export function generatePromptPy(prompt: PromptDef, moduleName: string): FileEntry {
  const slug = slugify(prompt.name)
  const name = pyName(slug)
  const params = paramsFromArgs(prompt.arguments)
  const sig = params ? `${name}(${params})` : `${name}()`
  const doc = prompt.description || `${name} prompt`
  const lines = [
    'from mcp.server.fastmcp import FastMCP',
    '',
    '',
    'def register(server: FastMCP) -> None:',
    '    @server.prompt()',
    `    def ${sig} -> str:`,
    `        """${doc}"""`,
    `        # TODO: render ${name} prompt`,
    `        return "TODO"`,
  ]
  return {
    path: `src/${moduleName}/prompts/${name}.py`,
    content: lines.join('\n') + '\n',
  }
}

export function generatePromptFiles(build: Build): FileEntry[] {
  const moduleName = pythonModuleName(build.packageMeta.name)
  return build.nodes
    .filter((n) => n.type === 'prompt')
    .map((n) => generatePromptPy(n.data as PromptDef, moduleName))
}
