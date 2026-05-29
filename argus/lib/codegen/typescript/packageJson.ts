import type { Build } from '@/lib/store/types'
import { slugify } from '@/lib/build/slug'
import type { FileEntry } from '../types'

export function generatePackageJson(build: Build): FileEntry {
  const meta = build.packageMeta
  const name = slugify(meta.name || 'mcp-server')
  const pkg = {
    name,
    version: meta.version || '0.1.0',
    description: meta.description || '',
    license: meta.license || 'MIT',
    type: 'module',
    main: 'dist/index.js',
    bin: { [name]: 'dist/index.js' },
    scripts: {
      build: 'tsc',
      start: 'node dist/index.js',
      dev: 'tsx src/index.ts',
    },
    dependencies: {
      '@modelcontextprotocol/sdk': '^1.0.0',
      zod: '^3.23.0',
    },
    devDependencies: {
      '@types/node': '^20.0.0',
      tsx: '^4.0.0',
      typescript: '^5.4.0',
    },
  }
  return {
    path: 'package.json',
    content: JSON.stringify(pkg, null, 2) + '\n',
  }
}
