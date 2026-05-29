export function normalizeHeaders(h: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(h)) {
    out[k.toLowerCase()] = v.trim()
  }
  return out
}

export function headerEquals(h: Record<string, string>, key: string, value: string): boolean {
  const n = normalizeHeaders(h)
  return n[key.toLowerCase()] === value
}

export function headerMatches(h: Record<string, string>, key: string, re: RegExp): boolean {
  const v = normalizeHeaders(h)[key.toLowerCase()]
  return typeof v === 'string' && re.test(v)
}
