import express, { type Express, type Request, type Response } from 'express'
import cors from 'cors'
import { isAllowedTarget } from './ssrf.js'

export interface ServerOptions { allowPrivate: boolean }

interface ProxyBody {
  url?: unknown
  init?: { method?: unknown; headers?: unknown; body?: unknown }
}

export function createApp({ allowPrivate }: ServerOptions): Express {
  const app = express()
  app.use(cors({ origin: '*', methods: ['POST', 'GET', 'OPTIONS'] }))
  app.use(express.json({ limit: '4mb' }))

  app.get('/health', (_req, res) => {
    res.json({ ok: true })
  })

  app.post('/proxy', async (req: Request, res: Response) => {
    const body = req.body as ProxyBody
    if (typeof body?.url !== 'string') {
      res.status(400).json({ error: 'url is required' })
      return
    }
    if (!isAllowedTarget(body.url, { allowPrivate })) {
      res.status(400).json({ error: 'target not allowed (private network or non-http scheme)' })
      return
    }
    const init = body.init ?? {}
    try {
      const upstream = await fetch(body.url, {
        method: typeof init.method === 'string' ? init.method : 'GET',
        headers: (init.headers as Record<string, string>) ?? {},
        body: typeof init.body === 'string' ? init.body : undefined,
      })
      const contentType = upstream.headers.get('content-type') ?? 'application/octet-stream'
      res.status(upstream.status).setHeader('content-type', contentType)
      if (contentType.includes('text/event-stream') && upstream.body) {
        res.setHeader('cache-control', 'no-cache')
        res.setHeader('x-accel-buffering', 'no')
        const reader = upstream.body.getReader()
        for (;;) {
          const { value, done } = await reader.read()
          if (done) break
          res.write(Buffer.from(value))
        }
        res.end()
        return
      }
      const buf = Buffer.from(await upstream.arrayBuffer())
      res.send(buf)
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      if (res.headersSent) {
        res.end()
        return
      }
      res.status(502).json({ error: `upstream fetch failed: ${message}` })
    }
  })

  return app
}
