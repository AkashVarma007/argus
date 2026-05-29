import type { Build } from '@/lib/store/types'
import { slugify } from '@/lib/build/slug'
import type { FileEntry } from '../types'
import { pythonModuleName } from './util'

function tomlString(s: string): string {
  return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

export function generatePyproject(build: Build): FileEntry {
  const meta = build.packageMeta
  const projectName = slugify(meta.name || 'mcp-server')
  const moduleName = pythonModuleName(meta.name || 'mcp-server')
  const lines: string[] = []
  lines.push('[project]')
  lines.push(`name = ${tomlString(projectName)}`)
  lines.push(`version = ${tomlString(meta.version || '0.1.0')}`)
  lines.push(`description = ${tomlString(meta.description || '')}`)
  lines.push(`requires-python = ">=3.10"`)
  lines.push(`license = { text = ${tomlString(meta.license || 'MIT')} }`)
  lines.push('dependencies = [')
  lines.push('  "mcp>=1.0.0",')
  lines.push(']')
  lines.push('')
  lines.push('[project.scripts]')
  lines.push(`${projectName} = "${moduleName}.__main__:main"`)
  lines.push('')
  lines.push('[build-system]')
  lines.push('requires = ["hatchling"]')
  lines.push('build-backend = "hatchling.build"')
  lines.push('')
  lines.push('[tool.hatch.build.targets.wheel]')
  lines.push(`packages = ["src/${moduleName}"]`)
  return { path: 'pyproject.toml', content: lines.join('\n') + '\n' }
}
