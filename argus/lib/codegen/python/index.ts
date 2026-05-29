import type { Build } from '@/lib/store/types'
import type { Codegen, FileEntry } from '../types'
import { generatePyproject } from './pyproject'
import { generateServerPy, generateInitFiles } from './server'
import { generateToolFiles } from './tool'
import { generatePromptFiles } from './prompt'
import { generateResourceFiles } from './resource'
import { generateMain, generateReadme, generateGitignore } from './entry'

export const pythonCodegen: Codegen = {
  language: 'python',
  generate(build: Build): FileEntry[] {
    return [
      generatePyproject(build),
      ...generateInitFiles(build),
      generateMain(build),
      generateServerPy(build),
      ...generateToolFiles(build),
      ...generatePromptFiles(build),
      ...generateResourceFiles(build),
      generateReadme(build),
      generateGitignore(),
    ]
  },
}
