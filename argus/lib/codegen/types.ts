import type { Build } from '@/lib/store/types'

export interface FileEntry {
  path: string
  content: string
}

export interface GeneratedProject {
  language: Build['language']
  name: string
  files: FileEntry[]
}

export interface Codegen {
  language: Build['language']
  generate(build: Build): FileEntry[]
}
