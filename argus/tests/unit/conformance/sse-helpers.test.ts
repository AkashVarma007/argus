import { describe, it, expect } from 'vitest'
import { parseSseChunk, collectSseEvents } from '@/lib/conformance/helpers/sse'

describe('sse helpers', () => {
  it('parseSseChunk yields events with data + id', () => {
    const raw =
      'id: 1\n' +
      'event: message\n' +
      'data: {"jsonrpc":"2.0","id":1,"result":{}}\n' +
      '\n' +
      'id: 2\n' +
      'data: {"jsonrpc":"2.0","method":"ping"}\n' +
      '\n'
    const events = parseSseChunk(raw)
    expect(events.length).toBe(2)
    expect(events[0]).toEqual({ id: '1', event: 'message', data: '{"jsonrpc":"2.0","id":1,"result":{}}' })
    expect(events[1].id).toBe('2')
  })

  it('collectSseEvents reads a ReadableStream and stops on the first JSON-RPC response with matching id', async () => {
    const enc = new TextEncoder()
    const body = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode('id: 1\ndata: {"jsonrpc":"2.0","method":"notifications/progress","params":{"progressToken":"a","progress":1}}\n\n'))
        c.enqueue(enc.encode('id: 2\ndata: {"jsonrpc":"2.0","id":42,"result":{}}\n\n'))
        c.close()
      },
    })
    const events = await collectSseEvents(body, { stopAtResponseId: 42, timeoutMs: 1000 })
    expect(events.length).toBe(2)
    const last = JSON.parse(events[1].data as string)
    expect(last.id).toBe(42)
  })

  it('collectSseEvents rejects with timeout error when stream stalls mid-read', async () => {
    const body = new ReadableStream<Uint8Array>({
      start() {
        // never enqueues or closes — simulates a stalling server
      },
    })
    await expect(collectSseEvents(body, { timeoutMs: 10 })).rejects.toThrow('SSE collect timeout after 10ms')
  })
})
