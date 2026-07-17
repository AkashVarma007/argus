#!/usr/bin/env node
// Minimal stdio MCP server used by Playwright happy-path E2E.
// Handles just enough to let the scan reach a grade.
import { createInterface } from 'node:readline'

const rl = createInterface({ input: process.stdin })

function send(obj) {
  process.stdout.write(JSON.stringify(obj) + '\n')
}

rl.on('line', (line) => {
  let msg
  try { msg = JSON.parse(line) } catch { return }
  const { id, method, params } = msg

  if (method === 'initialize') {
    send({
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: params?.protocolVersion ?? 'DRAFT-2026-v1',
        capabilities: { tools: {}, resources: {}, prompts: {} },
        serverInfo: { name: 'stub-mcp-server', version: '0.0.0' },
      },
    })
    return
  }
  if (method === 'ping') {
    send({ jsonrpc: '2.0', id, result: {} })
    return
  }
  if (method === 'tools/list') {
    send({ jsonrpc: '2.0', id, result: { tools: [] } })
    return
  }
  if (method === 'resources/list') {
    send({ jsonrpc: '2.0', id, result: { resources: [] } })
    return
  }
  if (method === 'prompts/list') {
    send({ jsonrpc: '2.0', id, result: { prompts: [] } })
    return
  }
  if (method && id !== undefined) {
    send({
      jsonrpc: '2.0',
      id,
      error: { code: -32601, message: `method not found: ${method}` },
    })
  }
})

rl.on('close', () => process.exit(0))
