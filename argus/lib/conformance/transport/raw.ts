export interface RawRequest {
  method: string
  headers: Record<string, string>
  body?: string
}

export interface RawResponse {
  status: number
  headers: Record<string, string>
  text(): Promise<string>
  json<T = unknown>(): Promise<T>
}

export interface RawHttpClient {
  readonly url: string
  fetch(req: RawRequest): Promise<RawResponse>
}

export interface CreateRawOpts {
  url: string
  proxyUrl?: string
}

export function createRawHttpClient({ url, proxyUrl }: CreateRawOpts): RawHttpClient {
  return {
    url,
    async fetch(req): Promise<RawResponse> {
      let endpoint = url
      let init: RequestInit = {
        method: req.method,
        headers: req.headers,
        body: req.body,
      }
      if (proxyUrl) {
        endpoint = proxyUrl
        init = {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ url, init: { method: req.method, headers: req.headers, body: req.body } }),
        }
      }
      const res = await fetch(endpoint, init)
      const headers: Record<string, string> = {}
      res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v })
      const cachedBody = await res.clone().text()
      return {
        status: res.status,
        headers,
        text: () => Promise.resolve(cachedBody),
        json: <T>() => Promise.resolve(JSON.parse(cachedBody) as T),
      }
    },
  }
}
