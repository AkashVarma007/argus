import Ajv, { type ValidateFunction } from 'ajv'
import addFormats from 'ajv-formats'

export interface SchemaLintIssue {
  path: string
  message: string
}

let cachedAjv: Ajv | null = null

function ajv(): Ajv {
  if (!cachedAjv) {
    cachedAjv = new Ajv({ strict: false, allErrors: true })
    addFormats(cachedAjv)
  }
  return cachedAjv
}

export function parseSchema(
  input: string,
): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } {
  try {
    const value = JSON.parse(input)
    if (typeof value !== 'object' || value === null || Array.isArray(value)) {
      return { ok: false, error: 'Schema must be a JSON object.' }
    }
    return { ok: true, value: value as Record<string, unknown> }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}

export function lintSchema(schema: Record<string, unknown>): SchemaLintIssue[] {
  const issues: SchemaLintIssue[] = []
  if (schema.type !== 'object') {
    issues.push({ path: '/type', message: 'Top-level type must be "object".' })
  }
  if (schema.properties !== undefined) {
    if (
      typeof schema.properties !== 'object' ||
      schema.properties === null ||
      Array.isArray(schema.properties)
    ) {
      issues.push({ path: '/properties', message: 'properties must be an object.' })
    }
  }
  if (schema.required !== undefined) {
    if (!Array.isArray(schema.required)) {
      issues.push({ path: '/required', message: 'required must be an array of strings.' })
    } else {
      const props = (schema.properties as Record<string, unknown> | undefined) ?? {}
      for (const key of schema.required) {
        if (typeof key !== 'string') {
          issues.push({ path: '/required', message: 'required entries must be strings.' })
          continue
        }
        if (!(key in props)) {
          issues.push({
            path: `/required/${key}`,
            message: `required key "${key}" missing from properties.`,
          })
        }
      }
    }
  }
  return issues
}

export function compileValidator(schema: Record<string, unknown>): ValidateFunction {
  return ajv().compile(schema)
}

export function validateSample(
  validate: ValidateFunction,
  sample: unknown,
): { ok: true } | { ok: false; errors: string[] } {
  const ok = validate(sample)
  if (ok) return { ok: true }
  const errs = (validate.errors ?? []).slice(0, 10).map((e) => {
    const path = e.instancePath || '/'
    return `${path}: ${e.message ?? 'invalid'}`
  })
  return { ok: false, errors: errs }
}
