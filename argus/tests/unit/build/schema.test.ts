import { describe, it, expect } from 'vitest'
import {
  parseSchema,
  lintSchema,
  compileValidator,
  validateSample,
} from '@/lib/build/schema'

describe('parseSchema', () => {
  it('parses a valid JSON object', () => {
    const r = parseSchema('{"type":"object"}')
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.value.type).toBe('object')
  })

  it('returns error on syntax mistakes', () => {
    const r = parseSchema('{"type":}')
    expect(r.ok).toBe(false)
  })

  it('rejects non-object roots', () => {
    expect(parseSchema('[]').ok).toBe(false)
    expect(parseSchema('"hi"').ok).toBe(false)
    expect(parseSchema('null').ok).toBe(false)
  })
})

describe('lintSchema', () => {
  it('valid object schema returns no issues', () => {
    expect(
      lintSchema({ type: 'object', properties: { x: { type: 'string' } } }),
    ).toEqual([])
  })

  it('reports missing type=object', () => {
    const issues = lintSchema({ properties: {} })
    expect(issues.some((i) => i.path === '/type')).toBe(true)
  })

  it('reports required entry missing from properties', () => {
    const issues = lintSchema({
      type: 'object',
      properties: { x: { type: 'string' } },
      required: ['x', 'y'],
    })
    expect(issues.some((i) => i.message.includes('"y"'))).toBe(true)
  })

  it('reports non-object properties field', () => {
    const issues = lintSchema({ type: 'object', properties: [] as unknown as Record<string, unknown> })
    expect(issues.some((i) => i.path === '/properties')).toBe(true)
  })
})

describe('compileValidator + validateSample', () => {
  it('passes a matching sample', () => {
    const v = compileValidator({
      type: 'object',
      properties: { x: { type: 'string' } },
      required: ['x'],
    })
    expect(validateSample(v, { x: 'hi' }).ok).toBe(true)
  })

  it('fails a non-matching sample', () => {
    const v = compileValidator({
      type: 'object',
      properties: { x: { type: 'string' } },
      required: ['x'],
    })
    const r = validateSample(v, { x: 42 })
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.errors.length).toBeGreaterThan(0)
  })
})
