import type { Build } from '@/lib/store/types'
import type { Codegen, FileEntry } from '../types'
import { generatePackageJson } from './packageJson'
import { generateTsconfig } from './tsconfig'
import { generateServerFile } from './server'
import { generateToolFiles } from './tool'
import { generatePromptFiles } from './prompt'
import { generateResourceFiles } from './resource'
import { generateEntry } from './entry'
import { generateReadme, generateGitignore } from './readme'

export const typescriptCodegen: Codegen = {
  language: 'typescript',
  generate(build: Build): FileEntry[] {
    return [
      generatePackageJson(build),
      generateTsconfig(),
      generateEntry(),
      generateServerFile(build),
      ...generateToolFiles(build),
      ...generatePromptFiles(build),
      ...generateResourceFiles(build),
      generateReadme(build),
      generateGitignore(),
    ]
  },
}
