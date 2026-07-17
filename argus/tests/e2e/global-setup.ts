import { spawn, type ChildProcess } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const STUB = join(HERE, 'fixtures', 'stub-mcp-server.mjs')
const BRIDGE_CLI = join(HERE, '..', '..', '..', 'argus-bridge', 'dist', 'cli.js')
const BRIDGE_PORT = Number(process.env.ARGUS_E2E_BRIDGE_PORT ?? 7889)

declare global {
  // eslint-disable-next-line no-var
  var __argusE2EBridge: { proc: ChildProcess | null } | undefined
}

export default async function globalSetup() {
  const bridge = spawn(
    'node',
    [BRIDGE_CLI, '--port', String(BRIDGE_PORT), '--cmd', `node "${STUB}"`],
    { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env } },
  )

  bridge.stdout?.on('data', (b: Buffer) => process.stdout.write(`[bridge] ${b}`))
  bridge.stderr?.on('data', (b: Buffer) => process.stderr.write(`[bridge] ${b}`))

  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('bridge did not start in 10s')), 10_000)
    const onData = (b: Buffer) => {
      if (b.toString().includes('listening on')) {
        clearTimeout(timer)
        bridge.stdout?.off('data', onData)
        resolve()
      }
    }
    bridge.stdout?.on('data', onData)
  })

  globalThis.__argusE2EBridge = { proc: bridge }
  process.env.ARGUS_E2E_BRIDGE_URL = `ws://127.0.0.1:${BRIDGE_PORT}/bridge`
}
