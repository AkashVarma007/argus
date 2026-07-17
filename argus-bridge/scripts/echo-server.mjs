#!/usr/bin/env node
import { createInterface } from 'node:readline'

const rl = createInterface({ input: process.stdin })

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n')
}

rl.on('line', (line) => {
  let msg
  try {
    msg = JSON.parse(line)
  } catch {
    return
  }
  if (msg.method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id: msg.id,
      result: {
        protocolVersion: msg.params?.protocolVersion ?? 'DRAFT-2026-v1',
        capabilities: {},
        serverInfo: { name: 'echo', version: '0.0.0' },
      },
    })
    return
  }
  if (msg.method && msg.id !== undefined) {
    send({
      jsonrpc: '2.0',
      id: msg.id,
      result: { method: msg.method, params: msg.params ?? null },
    })
  }
})

rl.on('close', () => process.exit(0))
