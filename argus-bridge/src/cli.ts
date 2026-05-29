#!/usr/bin/env node
import { Command } from 'commander'
import { createBridgeServer } from './server.js'

const program = new Command()
program
  .name('argus-bridge')
  .description('WebSocket-to-stdio bridge for testing stdio-only MCP servers')
  .option('-p, --port <port>', 'port to listen on', '7879')
  .option('-h, --host <host>', 'host to bind to', '127.0.0.1')
  .option('--allow-shell', 'permit shell metacharacters in exec strings', false)
  .parse(process.argv)

const opts = program.opts<{ port: string; host: string; allowShell: boolean }>()
const port = Number(opts.port)
if (Number.isNaN(port) || port <= 0) {
  console.error(`Invalid --port: ${opts.port}`)
  process.exit(1)
}
const { server } = createBridgeServer({ allowShell: opts.allowShell })
server.listen(port, opts.host, () => {
  console.log(`argus-bridge listening on ws://${opts.host}:${port}/bridge (allowShell=${opts.allowShell})`)
})
