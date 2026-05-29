function isPlain(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export function jsonSchemaToZod(schema: Record<string, unknown>): string {
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return `z.enum(${JSON.stringify(schema.enum)} as const)`
  }
  switch (schema.type) {
    case 'string':
      return 'z.string()'
    case 'number':
    case 'integer':
      return 'z.number()'
    case 'boolean':
      return 'z.boolean()'
    case 'null':
      return 'z.null()'
    case 'array': {
      const items = isPlain(schema.items) ? schema.items : { type: 'string' }
      return `z.array(${jsonSchemaToZod(items)})`
    }
    case 'object':
      return `z.object({ ${jsonSchemaToZodShape(schema)} })`
    default:
      return 'z.unknown()'
  }
}

export function jsonSchemaToZodShape(schema: Record<string, unknown>): string {
  const props = isPlain(schema.properties) ? schema.properties : {}
  const required = new Set<string>(
    Array.isArray(schema.required) ? (schema.required as unknown[]).filter((k): k is string => typeof k === 'string') : [],
  )
  const parts: string[] = []
  for (const [key, propSchema] of Object.entries(props)) {
    if (!isPlain(propSchema)) continue
    let expr = jsonSchemaToZod(propSchema)
    if (typeof propSchema.description === 'string' && propSchema.description) {
      expr += `.describe(${JSON.stringify(propSchema.description)})`
    }
    if (!required.has(key)) expr += '.optional()'
    parts.push(`${JSON.stringify(key)}: ${expr}`)
  }
  return parts.join(', ')
}
