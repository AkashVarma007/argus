import { pythonIdentifier } from './util'

function isPlain(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function jsonSchemaToPyType(schema: Record<string, unknown>): string {
  switch (schema.type) {
    case 'string':
      return 'str'
    case 'integer':
      return 'int'
    case 'number':
      return 'float'
    case 'boolean':
      return 'bool'
    case 'array': {
      const items = isPlain(schema.items) ? schema.items : { type: 'string' }
      return `list[${jsonSchemaToPyType(items)}]`
    }
    case 'object':
      return 'dict[str, Any]'
    default:
      return 'Any'
  }
}

export function paramsFromSchema(schema: Record<string, unknown>): string {
  const props = isPlain(schema.properties) ? schema.properties : {}
  const required = new Set<string>(
    Array.isArray(schema.required)
      ? (schema.required as unknown[]).filter((k): k is string => typeof k === 'string')
      : [],
  )
  const parts: string[] = []
  for (const [key, propSchema] of Object.entries(props)) {
    if (!isPlain(propSchema)) continue
    const py = jsonSchemaToPyType(propSchema)
    const safe = pythonIdentifier(key)
    if (required.has(key)) parts.push(`${safe}: ${py}`)
    else parts.push(`${safe}: ${py} | None = None`)
  }
  return parts.join(', ')
}
