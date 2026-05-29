import type { FileEntry } from '../types'

export function generateTsconfig(): FileEntry {
  const config = {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      outDir: 'dist',
      rootDir: 'src',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      declaration: true,
      sourceMap: true,
      resolveJsonModule: true,
      forceConsistentCasingInFileNames: true,
    },
    include: ['src/**/*.ts'],
    exclude: ['node_modules', 'dist'],
  }
  return {
    path: 'tsconfig.json',
    content: JSON.stringify(config, null, 2) + '\n',
  }
}
