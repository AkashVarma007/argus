import { createParser, type EventSourceMessage } from 'eventsource-parser'

export interface SseEvent {
  id?: string
  event?: string
  data: string
  retry?: number
}

export function parseSseChunk(raw: string): SseEvent[] {
  const events: SseEvent[] = []
  const parser = createParser({
    onEvent: (e: EventSourceMessage) => {
      events.push({ id: e.id, event: e.event ?? 'message', data: e.data })
    },
    onRetry: (retry: number) => {
      const last = events[events.length - 1]
      if (last) last.retry = retry
    },
  })
  parser.feed(raw)
  return events
}

interface CollectOptions {
  stopAtResponseId?: number | string
  timeoutMs?: number
  onEvent?: (e: SseEvent) => void
}

export async function collectSseEvents(
  body: ReadableStream<Uint8Array>,
  opts: CollectOptions = {},
): Promise<SseEvent[]> {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  const events: SseEvent[] = []
  let done = false

  const parser = createParser({
    onEvent: (e: EventSourceMessage) => {
      const evt: SseEvent = { id: e.id, event: e.event ?? 'message', data: e.data }
      events.push(evt)
      opts.onEvent?.(evt)
      if (opts.stopAtResponseId !== undefined) {
        try {
          const parsed = JSON.parse(evt.data) as { id?: unknown }
          if (parsed && parsed.id === opts.stopAtResponseId) done = true
        } catch {
          // ignore non-JSON events
        }
      }
    },
    onRetry: (retry: number) => {
      const last = events[events.length - 1]
      if (last) last.retry = retry
    },
  })

  const timeoutMs = opts.timeoutMs ?? 30_000
  const start = Date.now()

  while (!done) {
    const remaining = timeoutMs - (Date.now() - start)
    if (remaining <= 0) throw new Error(`SSE collect timeout after ${timeoutMs}ms`)

    let timer: ReturnType<typeof setTimeout> | undefined
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error(`SSE collect timeout after ${timeoutMs}ms`)), remaining)
    })

    let readResult: ReadableStreamReadResult<Uint8Array>
    try {
      readResult = await Promise.race([reader.read(), timeoutPromise])
    } finally {
      if (timer !== undefined) clearTimeout(timer)
    }

    const { value, done: readerDone } = readResult
    if (readerDone) {
      parser.feed(decoder.decode())  // flush buffered bytes
      break
    }
    parser.feed(decoder.decode(value, { stream: true }))
  }

  try { await reader.cancel() } catch { /* stream may already be closed */ }
  return events
}
