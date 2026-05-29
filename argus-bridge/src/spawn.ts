import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { createInterface } from 'node:readline'

const SHELL_METACHAR = /[;|&`$<>()*?{}\[\]\\!#~\n\r\x00]/

export interface ParseOpts { allowShell: boolean }

export interface ParsedExec {
  command: string
  args: string[]
}

export function parseExec(raw: string, opts: ParseOpts): ParsedExec {
  const trimmed = raw.trim()
  if (trimmed.length === 0) throw new Error('exec is empty')
  if (!opts.allowShell && SHELL_METACHAR.test(trimmed)) {
    throw new Error('shell metacharacters in exec are blocked; pass --allow-shell to override')
  }
  const tokens = tokenize(trimmed)
  const [command, ...args] = tokens
  return { command, args }
}

function tokenize(s: string): string[] {
  const out: string[] = []
  let cur = ''
  let quote: '"' | "'" | null = null
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (quote) {
      if (ch === quote) { quote = null; continue }
      cur += ch
      continue
    }
    if (ch === '"' || ch === "'") { quote = ch; continue }
    if (/\s/.test(ch)) {
      if (cur.length) { out.push(cur); cur = '' }
      continue
    }
    cur += ch
  }
  if (cur.length) out.push(cur)
  if (quote !== null) throw new Error('unterminated quoted string')
  return out
}

export interface SpawnedChild {
  write(line: string): void
  onLine(cb: (line: string) => void): void
  onExit(cb: (code: number | null) => void): void
  onStderr(cb: (line: string) => void): void
  close(): void
}

export function spawnChild({ command, args }: ParsedExec): SpawnedChild {
  const child: ChildProcessWithoutNullStreams = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'] })
  const stdoutRl = createInterface({ input: child.stdout })
  const stderrRl = createInterface({ input: child.stderr })
  const lineHandlers: ((l: string) => void)[] = []
  const stderrHandlers: ((l: string) => void)[] = []
  const exitHandlers: ((c: number | null) => void)[] = []
  stdoutRl.on('line', (l) => lineHandlers.forEach((h) => h(l)))
  stderrRl.on('line', (l) => stderrHandlers.forEach((h) => h(l)))
  child.on('exit', (code) => {
    stdoutRl.close()
    stderrRl.close()
    exitHandlers.forEach((h) => h(code))
  })
  child.on('error', () => {
    stdoutRl.close()
    stderrRl.close()
    exitHandlers.forEach((h) => h(null))
  })

  return {
    write(line) { child.stdin.write(line + '\n') },
    onLine(cb) { lineHandlers.push(cb) },
    onStderr(cb) { stderrHandlers.push(cb) },
    onExit(cb) { exitHandlers.push(cb) },
    close() {
      stdoutRl.close()
      stderrRl.close()
      try { child.stdin.end() } catch { /* may already be closed */ }
      child.kill('SIGTERM')
    },
  }
}
