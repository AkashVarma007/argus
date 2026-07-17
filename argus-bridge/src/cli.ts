#!/usr/bin/env node
import { Command } from 'commander'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createBridgeServer } from './server.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const pkg = JSON.parse(
  readFileSync(join(HERE, '..', 'package.json'), 'utf8'),
) as { version: string }

const program = new Command()
program
  .name('argus-bridge')
  .description('WebSocket-to-stdio bridge for testing stdio-only MCP servers')
  .version(pkg.version)
  .option('-p, --port <port>', 'port to listen on', '7879')
  .option('-h, --host <host>', 'host to bind to', '127.0.0.1')
  .option('--allow-shell', 'permit shell metacharacters in exec strings', false)
  .option('--cmd <command>', 'fixed exec command; ignores ?exec= from client URL')
  .parse(process.argv)

const opts = program.opts<{
  port: string
  host: string
  allowShell: boolean
  cmd?: string
}>()
const port = Number(opts.port)
if (Number.isNaN(port) || port <= 0) {
  console.error(`Invalid --port: ${opts.port}`)
  process.exit(1)
}
const { server } = createBridgeServer({
  allowShell: opts.allowShell,
  fixedExec: opts.cmd,
})
server.listen(port, opts.host, () => {
  const mode = opts.cmd ? `cmd="${opts.cmd}"` : 'exec from query'
  console.log(
    `argus-bridge listening on ws://${opts.host}:${port}/bridge (allowShell=${opts.allowShell}, ${mode})`,
  )
})
