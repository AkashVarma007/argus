interface CurlInput {
  method: string
  url: string
  headers: Record<string, string>
  body?: unknown
}

export function renderCurl({ method, url, headers, body }: CurlInput): string {
  const lines: string[] = [`curl -X ${method} '${url}'`]
  for (const [k, v] of Object.entries(headers)) {
    lines.push(`  -H '${k}: ${v}'`)
  }
  if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    const payload = typeof body === 'string' ? body : JSON.stringify(body)
    lines.push(`  -d '${payload.replace(/'/g, "'\\''")}'`)
  }
  return lines.join(' \\\n')
}
