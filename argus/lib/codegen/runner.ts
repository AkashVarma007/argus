import type { Build, BuildIssue } from '@/lib/store/types'
import { validateBuild } from '@/lib/build/validate'
import { slugify } from '@/lib/build/slug'
import type { Codegen, GeneratedProject } from './types'
import { typescriptCodegen } from './typescript'
import { pythonCodegen } from './python'

export type RunCodegenResult =
  | { ok: true; project: GeneratedProject }
  | { ok: false; issues: BuildIssue[] }

const CODEGENS: Record<Build['language'], Codegen> = {
  typescript: typescriptCodegen,
  python: pythonCodegen,
}

export function runCodegen(build: Build): RunCodegenResult {
  const issues = validateBuild(build)
  const hasError = issues.some((i) => i.severity === 'error')
  if (hasError) {
    return { ok: false, issues }
  }
  const codegen = CODEGENS[build.language]
  const files = codegen.generate(build)
  const name = slugify(build.packageMeta.name || 'mcp-server')
  return {
    ok: true,
    project: { language: build.language, name, files },
  }
}
