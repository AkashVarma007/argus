import { describe, it, expect } from 'vitest'
import JSZip from 'jszip'
import { packZip } from '@/lib/codegen/zip'
import type { GeneratedProject } from '@/lib/codegen/types'

const sample: GeneratedProject = {
  language: 'typescript',
  name: 'demo-server',
  files: [
    { path: 'package.json', content: '{"name":"demo-server"}' },
    { path: 'src/index.ts', content: 'console.log("hi")' },
    { path: 'README.md', content: '# demo-server' },
  ],
}

function blobToBuffer(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => resolve(reader.result as ArrayBuffer)
    reader.readAsArrayBuffer(blob)
  })
}

describe('packZip', () => {
  it('returns a Blob', async () => {
    const blob = await packZip(sample)
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.size).toBeGreaterThan(0)
  })

  it('packs every file under the project name root folder', async () => {
    const blob = await packZip(sample)
    const buf = await blobToBuffer(blob)
    const zip = await JSZip.loadAsync(buf)
    expect(zip.file('demo-server/package.json')).not.toBeNull()
    expect(zip.file('demo-server/src/index.ts')).not.toBeNull()
    expect(zip.file('demo-server/README.md')).not.toBeNull()
  })

  it('preserves file contents byte-for-byte', async () => {
    const blob = await packZip(sample)
    const buf = await blobToBuffer(blob)
    const zip = await JSZip.loadAsync(buf)
    const pkg = await zip.file('demo-server/package.json')!.async('string')
    expect(pkg).toBe('{"name":"demo-server"}')
    const idx = await zip.file('demo-server/src/index.ts')!.async('string')
    expect(idx).toBe('console.log("hi")')
  })
})
