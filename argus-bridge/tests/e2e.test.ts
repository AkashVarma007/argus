import { describe, it, expect } from 'vitest'
import WebSocket from 'ws'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { createBridgeServer } from '../src/server.js'

const HERE = dirname(fileURLToPath(import.meta.url))
const ECHO = join(HERE, '..', 'scripts', 'echo-server.mjs')

function listen(server: import('node:http').Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as import('node:net').AddressInfo
      resolve(addr.port)
    })
  })
}

async function nextFrame(ws: WebSocket): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout waiting for frame')), 5000)
    ws.once('message', (data) => {
      clearTimeout(timer)
      try {
        resolve(JSON.parse(data.toString()))
      } catch (err) {
        reject(err as Error)
      }
    })
  })
}

describe('argus-bridge end-to-end', () => {
  it('round-trips initialize then ping through a real subprocess', async () => {
    const bridge = createBridgeServer({ allowShell: false })
    const port = await listen(bridge.server)

    const exec = encodeURIComponent(`node "${ECHO}"`)
    const ws = new WebSocket(
      `ws://127.0.0.1:${port}/bridge?exec=${exec}&protocol=DRAFT-2026-v1`,
    )
    await new Promise<void>((resolve, reject) => {
      ws.once('open', () => resolve())
      ws.once('error', reject)
    })

    try {
      ws.send(
        JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: { protocolVersion: 'DRAFT-2026-v1', capabilities: {}, clientInfo: { name: 'test', version: '0.0.0' } },
        }),
      )
      const init = (await nextFrame(ws)) as {
        result: { serverInfo: { name: string }; protocolVersion: string }
        id: number
      }
      expect(init.id).toBe(1)
      expect(init.result.serverInfo.name).toBe('echo')
      expect(init.result.protocolVersion).toBe('DRAFT-2026-v1')

      ws.send(
        JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }),
      )

      ws.send(JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'ping' }))
      const pong = (await nextFrame(ws)) as { id: number; result: { method: string } }
      expect(pong.id).toBe(2)
      expect(pong.result.method).toBe('ping')
    } finally {
      ws.close()
      await new Promise<void>((resolve) => bridge.close(resolve))
    }
  })
})
