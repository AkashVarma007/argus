import { describe, it, expect } from 'vitest'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { readFileSync } from 'node:fs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CLI = join(HERE, '..', 'src', 'cli.ts')
const PKG = JSON.parse(readFileSync(join(HERE, '..', 'package.json'), 'utf8')) as {
  version: string
}

describe('argus-bridge CLI', () => {
  it('prints package version with --version', () => {
    const r = spawnSync('npx', ['-y', 'tsx', CLI, '--version'], {
      encoding: 'utf8',
      timeout: 15000,
    })
    expect(r.status).toBe(0)
    expect(r.stdout.trim()).toBe(PKG.version)
  })

  it('rejects invalid --port', () => {
    const r = spawnSync('npx', ['-y', 'tsx', CLI, '--port', 'abc'], {
      encoding: 'utf8',
      timeout: 15000,
    })
    expect(r.status).toBe(1)
    expect(r.stderr).toMatch(/Invalid --port/i)
  })
})
