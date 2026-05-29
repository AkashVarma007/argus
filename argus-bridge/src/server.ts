import { createServer, type Server } from 'node:http'
import { WebSocketServer, type WebSocket } from 'ws'
import { parseExec, spawnChild, type ParsedExec } from './spawn.js'

export interface ServerOptions {
  allowShell: boolean
}

export interface BridgeServer {
  server: Server
  close(cb?: () => void): void
}

export function createBridgeServer({ allowShell }: ServerOptions): BridgeServer {
  const httpServer: Server = createServer()
  const wss = new WebSocketServer({ noServer: true })

  httpServer.on('upgrade', (req, socket, head) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
    if (url.pathname !== '/bridge') {
      socket.destroy()
      return
    }
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req)
    })
  })

  wss.on('connection', (ws: WebSocket, req: import('node:http').IncomingMessage) => {
    const url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
    const exec = url.searchParams.get('exec')

    if (!exec) {
      ws.close(4001, 'missing exec query parameter')
      return
    }

    let parsed: ParsedExec
    try {
      parsed = parseExec(exec, { allowShell })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      ws.close(4002, msg)
      return
    }

    const child = spawnChild(parsed)
    let alive = true

    child.onLine((line) => {
      if (ws.readyState === ws.OPEN) {
        ws.send(line)
      }
    })

    child.onStderr((line) => {
      console.error('[argus-bridge stderr] ' + line)
    })

    child.onExit((code) => {
      alive = false
      ws.close(4003, `child exited with code ${code}`)
    })

    ws.on('message', (data) => {
      if (!alive) return
      const text = data.toString()
      child.write(text.replace(/[\r\n]+$/, ''))
    })

    ws.on('close', () => {
      alive = false
      child.close()
    })
  })

  return {
    server: httpServer,
    close(cb) {
      wss.clients.forEach((ws) => ws.close())
      wss.close()
      httpServer.close(cb ?? (() => undefined))
    },
  }
}
