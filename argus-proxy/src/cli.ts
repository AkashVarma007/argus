#!/usr/bin/env node
import { Command } from 'commander'
import { createApp } from './server.js'

const program = new Command()
program
  .name('argus-proxy')
  .description('Local CORS proxy for testing MCP servers from the Argus web app')
  .option('-p, --port <port>', 'port to listen on', '7878')
  .option('-h, --host <host>', 'host to bind to (default: 127.0.0.1)', '127.0.0.1')
  .option('--allow-private', 'permit targets on private/loopback networks', false)
  .parse(process.argv)

const opts = program.opts<{ port: string; host: string; allowPrivate: boolean }>()
const app = createApp({ allowPrivate: opts.allowPrivate })
const port = Number(opts.port)
if (Number.isNaN(port) || port <= 0) {
  console.error(`Invalid --port: ${opts.port}`)
  process.exit(1)
}
app.listen(port, opts.host, () => {
  console.log(`argus-proxy listening on http://${opts.host}:${port}/proxy (allowPrivate=${opts.allowPrivate})`)
})
