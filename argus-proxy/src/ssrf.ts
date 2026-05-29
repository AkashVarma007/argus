const PRIVATE_IPV4 = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^169\.254\./,
  /^0\.0\.0\.0$/,
]

function isPrivateIpv6(hostname: string): boolean {
  const h = hostname.toLowerCase()
  return (
    h === '::1' ||
    h.startsWith('fe80:') ||
    h.startsWith('fc00:') ||
    h.startsWith('fd') ||
    h.startsWith('::ffff:')  // IPv4-mapped IPv6 — block conservatively
  )
}

export interface GuardOpts { allowPrivate: boolean }

export function isAllowedTarget(raw: string, opts: GuardOpts): boolean {
  let u: URL
  try { u = new URL(raw) } catch { return false }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
  if (opts.allowPrivate) return true
  const host = u.hostname.toLowerCase()
  if (host === 'localhost') return false
  if (PRIVATE_IPV4.some((p) => p.test(host))) return false
  // URL.hostname keeps brackets for IPv6 literals: "[::1]" — strip them before checking
  const ipv6Bare = host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host
  if (ipv6Bare.includes(':') && isPrivateIpv6(ipv6Bare)) return false
  return true
}
