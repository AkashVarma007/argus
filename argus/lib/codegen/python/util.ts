import { slugify } from '@/lib/build/slug'

export function pythonModuleName(name: string): string {
  const slug = slugify(name || 'mcp_server')
  return slug.replace(/-/g, '_')
}

export function pythonIdentifier(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, '_')
}

export function pythonStringLiteral(s: string): string {
  return JSON.stringify(s)
}

export function resourceModuleName(uri: string, index: number): string {
  const m = uri.match(/([a-zA-Z0-9_-]+)(?:\.[a-zA-Z0-9]+)?$/)
  const stem = m ? m[1] : `resource_${index + 1}`
  const safe = slugify(stem).replace(/-/g, '_')
  return safe || `resource_${index + 1}`
}
